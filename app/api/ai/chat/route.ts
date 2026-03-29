import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { Prisma } from "@prisma/client"
import {
  canConsumeAiRequest,
  getUsageSummary,
  logUsage,
} from "@/lib/usage"
import { streamLlmResponse, generateLlmResponse, type LlmProviderSpec } from "@/lib/llm"
import type { GeminiMessage } from "@/lib/gemini"
import { createMcpClient } from "@/lib/mcp"
// Legacy planner/executor removed — v2 agent handles tool selection directly
import type {
  AgentStreamEvent,
  ExecutionPlan,
  ExecutionLogEntry,
  PlanStep,
  PlanningMetadata,
  ResearchSource,
} from "@/lib/orchestration/types"
import type { ExecutionResult } from "@/lib/orchestration/executor"
import { recordExecutionLog } from "@/lib/orchestration/monitor"
import { buildSystemPrompt } from "@/lib/orchestration/prompts"
import { searchFirecrawl, type FirecrawlSearchResult } from "@/lib/firecrawl"
import { formatContextFromSources } from "@/lib/ai/rag"
import { classifyStrategy } from "@/lib/orchestration/strategy-router"
import type { StrategyDecision } from "@/lib/orchestration/strategy-types"
import { generateWorkflowProposal } from "@/lib/orchestration/workflow-advisor"
import { createMonitoringSession, type MonitoringSession } from "@/lib/monitoring"
import { z } from "zod"

const MAX_HISTORY_MESSAGES = 12

type CommandStatus = "pending" | "ready" | "executed" | "failed"

interface CommandStub {
  id: string
  tool: string
  description: string
  status: CommandStatus
  confidence: number
  arguments: Record<string, unknown>
  notes?: string
}

interface ExecutedCommand extends CommandStub {
  status: "executed" | "failed"
  result?: unknown
  error?: string
}

type ToolTraceStatus = "started" | "completed" | "failed" | "skipped"

interface ToolTraceEntry {
  id: string
  tool: string
  status: ToolTraceStatus
  timestamp: string
  args: Record<string, unknown>
  error?: string
  duplicate?: boolean
}

function createStubId() {
  try {
    return randomUUID()
  } catch {
    return `stub-${Date.now()}`
  }
}

function summarizeToolArgsForMonitor(args: Record<string, unknown>): Record<string, unknown> {
  const summarizeValue = (value: unknown, depth = 0): unknown => {
    if (typeof value === "string") {
      return value.length > 160 ? `${value.slice(0, 160)}… (${value.length} chars)` : value
    }
    if (Array.isArray(value)) {
      const preview = value.slice(0, 8).map((item) => summarizeValue(item, depth + 1))
      return value.length > 8 ? [...preview, `… (+${value.length - 8} more)`] : preview
    }
    if (value && typeof value === "object") {
      if (depth >= 1) return "[object]"
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, summarizeValue(nested, depth + 1)])
      )
    }
    return value
  }

  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => [key, summarizeValue(value)])
  )
}

function buildExecutedCommandsFromToolTrace(
  trace: ToolTraceEntry[],
  interruptedError?: string
): ExecutedCommand[] {
  const commands: ExecutedCommand[] = []

  for (const entry of trace) {
    if (entry.status === "completed") {
      commands.push({
        id: createStubId(),
        tool: entry.tool,
        description: `Agent called ${entry.tool}`,
        status: "executed" as const,
        confidence: entry.duplicate ? 0.4 : 0.8,
        arguments: entry.args,
      })
      continue
    }

    if (entry.status === "failed") {
      commands.push({
        id: createStubId(),
        tool: entry.tool,
        description: `Agent called ${entry.tool}`,
        status: "failed" as const,
        confidence: 0.3,
        arguments: entry.args,
        error: entry.error ?? interruptedError,
      })
      continue
    }

    if (entry.status === "started" && interruptedError) {
      commands.push({
        id: createStubId(),
        tool: entry.tool,
        description: `Agent started ${entry.tool} before interruption`,
        status: "failed" as const,
        confidence: 0.2,
        arguments: entry.args,
        error: interruptedError,
      })
    }
  }

  return commands
}

const WEB_RESEARCH_PATTERN = /(reference|research|inspiration|latest|trend|real[-\s]?world|accurate details|current|examples|ideas|design ideas|styles? from)/i

function shouldUseWebResearch(message: string) {
  return WEB_RESEARCH_PATTERN.test(message)
}

function buildResearchContext(result: FirecrawlSearchResult): {
  promptContext: string
  sources: ResearchSource[]
} {
  const trimmed = result.results.slice(0, 3)

  const sources: ResearchSource[] = trimmed.map((item) => ({
    title: item.title,
    url: item.url,
    snippet: item.snippet,
  }))

  const promptContext = sources
    .map((source, index) => {
      const snippet = source.snippet ? source.snippet.slice(0, 220) : "No snippet provided"
      return `${index + 1}. ${source.title} — ${snippet} (Source: ${source.url})`
    })
    .join("\n")

  return { promptContext, sources }
}

function resolveLocalProviderSpec(
  provider: string | null | undefined,
  baseUrl: string | null | undefined,
  model: string | null | undefined,
  apiKey: string | null | undefined
): LlmProviderSpec | null {
  if (!provider || !baseUrl || !model) {
    return null
  }

  const normalizedProvider = provider.toLowerCase()
  if (normalizedProvider === "ollama") {
    return {
      type: "ollama",
      baseUrl,
      model,
    }
  }

  if (normalizedProvider === "lmstudio") {
    return {
      type: "lmstudio",
      baseUrl,
      model,
      apiKey,
    }
  }

  return null
}


async function fetchSceneSummary(): Promise<{ summary: string | null; raw: unknown }> {
  const client = createMcpClient()
  try {
    const response = await client.execute({ type: "get_scene_info" })
    if (response.status === "ok" || response.status === "success") {
      const payload = response.result ?? response.raw ?? null
      return { summary: formatSceneSnapshot(payload), raw: payload }
    }
    return {
      summary: formatSceneSnapshot({ error: response.message ?? "Unknown MCP response" }),
      raw: response,
    }
  } catch (error) {
    return {
      summary: formatSceneSnapshot({ error: error instanceof Error ? error.message : "Failed to fetch scene" }),
      raw: null,
    }
  } finally {
    await client.close().catch(() => undefined)
  }
}

function formatSceneSnapshot(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const scene = payload as Record<string, unknown>
  const name = typeof scene.name === "string" ? scene.name : "Unknown"
  const objectCount = typeof scene.object_count === "number" ? scene.object_count : undefined
  const errorMessage = typeof scene.error === "string" ? (scene.error as string) : undefined

  const objectList = Array.isArray(scene.objects) ? scene.objects.slice(0, 30) : []
  const structuredObjects = objectList
    .filter((raw): raw is Record<string, unknown> => !!raw && typeof raw === "object")
    .map((obj) => {
      const entry: Record<string, unknown> = {
        name: typeof obj.name === "string" ? obj.name : "(unnamed)",
        type: typeof obj.type === "string" ? obj.type : "UNKNOWN",
      }
      if (Array.isArray(obj.location)) {
        entry.location = obj.location.slice(0, 3).map((v) => typeof v === "number" ? Math.round(v * 100) / 100 : 0)
      }
      if (Array.isArray(obj.dimensions)) {
        entry.dimensions = obj.dimensions.slice(0, 3).map((v) => typeof v === "number" ? Math.round(v * 100) / 100 : 0)
      }
      return entry
    })

  const materialsCount =
    typeof scene.materials_count === "number"
      ? scene.materials_count
      : undefined

  // Return structured JSON so the model can parse object names and locations precisely
  const snapshot: Record<string, unknown> = {
    scene: name,
    object_count: objectCount,
    materials_count: materialsCount,
    objects: structuredObjects,
  }
  if (errorMessage) {
    snapshot.error = errorMessage
  }

  return JSON.stringify(snapshot, null, 2)
}


function buildExecutedCommandsFromPlan(
  plan: ExecutionPlan,
  execution: ExecutionResult
): ExecutedCommand[] {
  // Build lookup maps using action string as key (steps don't have stepNumber)
  const completedMap = new Map<string, { step: Record<string, unknown>; result: unknown }>()
  for (const entry of execution.completedSteps) {
    completedMap.set(entry.step.action, entry as unknown as { step: Record<string, unknown>; result: unknown })
  }

  const failedMap = new Map<string, string>()
  for (const entry of execution.failedSteps) {
    failedMap.set(entry.step.action, entry.error)
  }

  const commands: ExecutedCommand[] = []
  let failureEncountered = false

  for (const step of plan.steps) {
    const stepAny = step as unknown as Record<string, unknown>
    const stepDesc = (stepAny.expectedOutcome as string)
      || (stepAny.expected_outcome as string)
      || step.rationale
    const completed = completedMap.get(step.action)
    const failedError = failedMap.get(step.action)

    if (completed) {
      commands.push({
        id: createStubId(),
        tool: step.action,
        description: stepDesc,
        status: "executed",
        confidence: 0.65,
        arguments: step.parameters ?? {},
        notes: `Plan rationale: ${step.rationale}`,
        result: completed.result,
      })
      continue
    }

    if (failedError) {
      commands.push({
        id: createStubId(),
        tool: step.action,
        description: stepDesc,
        status: "failed",
        confidence: 0.65,
        arguments: step.parameters ?? {},
        notes: `Plan rationale: ${step.rationale}`,
        error: failedError,
      })
      failureEncountered = true
      continue
    }

    if (failureEncountered) {
      commands.push({
        id: createStubId(),
        tool: step.action,
        description: stepDesc,
        status: "failed",
        confidence: 0.4,
        arguments: step.parameters ?? {},
        notes: `Plan rationale: ${step.rationale}`,
        error: "Step skipped due to earlier failure",
      })
    }
  }

  return commands
}

const chatRequestSchema = z.object({
  projectId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  startNew: z.boolean().optional(),
  message: z.string().min(1).max(2000),
  useLocalModel: z.boolean().optional(),
  workflowMode: z.enum(["autopilot", "studio"]).optional(),
  studioStep: z.boolean().optional(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number().optional(),
    data: z.string(), // base64 encoded image data
  })).optional(),
})

async function ensureConversation({
  projectId,
  userId,
  conversationId,
  startNew,
  workflowMode,
}: {
  projectId: string
  userId: string
  conversationId?: string
  startNew?: boolean
  workflowMode?: string
}) {
  const mode = workflowMode ?? "autopilot"

  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        project: {
          id: projectId,
          userId,
          isDeleted: false,
        },
      },
      select: { id: true },
    })

    if (!conversation) {
      throw new Error("Conversation not found")
    }

    return conversationId
  }

  if (!startNew) {
    const existing = await prisma.conversation.findFirst({
      where: {
        workflowMode: mode,
        project: {
          id: projectId,
          userId,
          isDeleted: false,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      select: { id: true },
    })

    if (existing) {
      return existing.id
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      projectId,
      workflowMode: mode,
    },
    select: { id: true },
  })

  return conversation.id
}


export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, conversationId, startNew, message, useLocalModel, workflowMode, studioStep, attachments } =
      chatRequestSchema.parse(body)

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        allowHyper3dAssets: true,
        allowSketchfabAssets: true,
        allowPolyHavenAssets: true,
        allowWebResearch: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    const subscriptionTier = session.user.subscriptionTier ?? "free"
    const normalizedTier = subscriptionTier.toLowerCase()
    const assetConfig = {
      allowHyper3d: Boolean(project.allowHyper3dAssets),
      allowSketchfab: Boolean(project.allowSketchfabAssets),
      allowPolyHaven: project.allowPolyHavenAssets !== false,
      allowWebResearch:
        (normalizedTier === "starter" || normalizedTier === "pro") &&
        Boolean(project.allowWebResearch),
    }
    const localProviderSpec = resolveLocalProviderSpec(
      session.user.localLlmProvider,
      session.user.localLlmUrl,
      session.user.localLlmModel,
      session.user.localLlmApiKey
    )

    const wantsLocal =
      subscriptionTier === "free" ? true : useLocalModel === true

    let llmProvider: LlmProviderSpec

    if (wantsLocal) {
      if (!localProviderSpec) {
        const messageText =
          subscriptionTier === "free"
            ? "Local LLM configuration is required for free-tier usage. Configure Ollama or LM Studio in Settings."
            : "Local LLM configuration is incomplete. Please provide base URL and model in Settings or disable local usage."
        return NextResponse.json(
          { error: messageText },
          { status: 400 }
        )
      }
      llmProvider = localProviderSpec
    } else {
      // Cloud provider: check AI_PROVIDER env var (default: gemini)
      const aiProvider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase()
      if (aiProvider === "anthropic" || aiProvider === "claude") {
        llmProvider = { type: "anthropic" }
      } else {
        llmProvider = { type: "gemini" }
      }
    }

    const chatSystemPrompt = buildSystemPrompt()

    let researchContext: { promptContext: string; sources: ResearchSource[] } | null = null
    if (assetConfig.allowWebResearch && shouldUseWebResearch(message)) {
      const researchResult = await searchFirecrawl(message)
      if (researchResult) {
        researchContext = buildResearchContext(researchResult)
      }
    }

    const quotaCheck = await canConsumeAiRequest(
      session.user.id,
      session.user.subscriptionTier
    )

    if (!quotaCheck.allowed) {
      const limitLabel =
        quotaCheck.limitType === "daily" ? "daily" : "monthly"
      return NextResponse.json(
        {
          error: `AI request limit reached for your ${limitLabel} allotment. Please upgrade your plan or try again later.`,
          usage: quotaCheck.usage,
        },
        { status: 429 }
      )
    }

    let resolvedConversationId: string
    try {
      resolvedConversationId = await ensureConversation({
        projectId,
        userId: session.user.id,
        conversationId,
        startNew,
        workflowMode,
      })
    } catch {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    const currentMode = workflowMode ?? "autopilot"
    const historyMessages = await prisma.message.findMany({
      where: { conversationId: resolvedConversationId },
      orderBy: { createdAt: "desc" },
      take: Math.max(0, MAX_HISTORY_MESSAGES - 1),
      select: {
        role: true,
        content: true,
        mcpResults: true,
      },
    })

    // Filter out messages from the other mode to prevent context pollution
    const trimmedHistory: GeminiMessage[] = historyMessages
      .reverse()
      .filter((msg) => {
        const results = msg.mcpResults as Record<string, unknown> | null
        const msgMode = results?.workflowMode as string | undefined
        // Keep messages with no mode tag (legacy) or matching mode
        return !msgMode || msgMode === currentMode
      })
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })) as GeminiMessage[]

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) => {
          controller.enqueue(
            encoder.encode(`${JSON.stringify(data)}\n`)
          )
        }

        send({ type: "init", conversationId: resolvedConversationId })

        // Create monitoring session for this request
        const monitor = createMonitoringSession(
          resolvedConversationId,
          (entry) => {
            // Stream each log entry to the UI in real-time
            send({
              type: "agent:monitoring_log",
              timestamp: entry.timestamp,
              entry,
            })
          }
        )
        monitor.info("system", "Pipeline started", {
          conversationId: resolvedConversationId,
          projectId,
          userId: session.user.id,
          workflowMode: workflowMode ?? "autopilot",
        })
        monitor.startTimer("total_pipeline")

        let assistantText = ""
        let tokenUsage: { promptTokens?: number | null; responseTokens?: number | null; totalTokens?: number | null } | undefined

        try {
          // ── Studio step execution: skip text streaming + strategy classification ──
          // Studio mode already chose the tool, so we go straight to agent execution.
          if (!studioStep) {
            for await (const chunk of streamLlmResponse(llmProvider, {
              history: trimmedHistory,
              messages: [
                {
                  role: "user",
                  content: message,
                },
              ],
              maxOutputTokens: 512,
              systemPrompt: chatSystemPrompt,
            })) {
              if (chunk.textDelta) {
                assistantText += chunk.textDelta
                send({ type: "delta", delta: chunk.textDelta })
              }
              if (chunk.usage) {
                tokenUsage = chunk.usage
              }
            }
          }


          const sceneSnapshotResult = await fetchSceneSummary()

          // Strategy classification: determine procedural vs neural vs hybrid
          // Skip for studioStep — user already chose the tool
          let strategyDecision: StrategyDecision
          if (studioStep) {
            strategyDecision = {
              strategy: "procedural",
              confidence: 1.0,
              reasoning: "Studio step execution — tool already selected by user",
              classificationMethod: "user_override",
            }
            monitor.info("strategy", "Strategy bypassed for studio step (procedural)")
          } else {
            monitor.startTimer("strategy_classification")
            strategyDecision = await classifyStrategy(message, {
              sceneContext: sceneSnapshotResult.summary ?? undefined,
              monitor,
            })
            monitor.endTimer("strategy_classification")
            monitor.info("strategy", `Strategy: ${strategyDecision.strategy} (${(strategyDecision.confidence * 100).toFixed(0)}% confidence)`, {
              strategy: strategyDecision.strategy,
              confidence: strategyDecision.confidence,
              method: strategyDecision.classificationMethod,
            })
            send({
              type: "agent:strategy_classification",
              timestamp: new Date().toISOString(),
              strategy: strategyDecision.strategy,
              confidence: strategyDecision.confidence,
              reasoning: strategyDecision.reasoning,
              method: strategyDecision.classificationMethod,
            })
          }

          let executedCommands: ExecutedCommand[] = []
          let planningMetadata: PlanningMetadata | null = null
          let executionLogs: ExecutionLogEntry[] = []
          let ragDocCount = 0
          const toolTraceById = new Map<string, ToolTraceEntry>()
          const toolTraceOrder: string[] = []

          const getToolTrace = () =>
            toolTraceOrder
              .map((id) => toolTraceById.get(id))
              .filter((entry): entry is ToolTraceEntry => Boolean(entry))

          const recordToolEvent = (
            event: Extract<AgentStreamEvent, { type: "agent:tool_call" }>
          ) => {
            const toolCallId = event.toolCallId ?? `${event.toolName}-${toolTraceOrder.length + 1}`
            const existing = toolTraceById.get(toolCallId)
            if (!existing) {
              toolTraceOrder.push(toolCallId)
            }

            const nextEntry: ToolTraceEntry = {
              id: toolCallId,
              tool: event.toolName,
              status: event.status,
              timestamp: event.timestamp,
              args: event.args ?? existing?.args ?? {},
              error: event.error ?? existing?.error,
              duplicate: event.duplicate ?? existing?.duplicate ?? false,
            }

            toolTraceById.set(toolCallId, nextEntry)
            executionLogs.push({
              timestamp: event.timestamp,
              tool: event.toolName,
              parameters: nextEntry.args,
              error: event.status === "failed" ? nextEntry.error : undefined,
              logType: event.status === "skipped" ? "system" : "execute",
              detail:
                event.status === "skipped"
                  ? `Skipped duplicate tool call: ${event.toolName}`
                  : `Tool ${event.status}: ${event.toolName}`,
            })
            monitor.debug("agent", `Tool ${event.status}: ${event.toolName}`, {
              toolCallId,
              duplicate: nextEntry.duplicate ?? false,
              args: summarizeToolArgsForMonitor(nextEntry.args),
            })
          }

          // ── Neural/Hybrid or Studio mode → Guided Workflow (human-in-the-loop) ──
          // Note: studioStep uses the procedural path directly (bypasses workflow proposal)
          const useGuidedWorkflow = !studioStep && (workflowMode === "studio" ||
            strategyDecision.strategy === "neural" || strategyDecision.strategy === "hybrid")
          if (useGuidedWorkflow) {
            try {
              const workflowProposal = await generateWorkflowProposal(
                message,
                strategyDecision.strategy,
                { sceneContext: sceneSnapshotResult.summary ?? undefined }
              )

              // Send the workflow proposal to the UI
              send({
                type: "agent:workflow_proposal",
                timestamp: new Date().toISOString(),
                proposal: workflowProposal,
              })

              // Build a lightweight planningMetadata for the conversation record
              planningMetadata = {
                planSummary: `Workflow proposed: ${workflowProposal.title} (${workflowProposal.steps.length} steps). Awaiting user action on each step.`,
                planSteps: workflowProposal.steps.map((s) => ({
                  stepNumber: s.stepNumber,
                  action: s.recommendedTool === "neural" ? "neural_generate" : s.recommendedTool === "manual" ? "manual" : "execute_code",
                  parameters: {
                    category: s.category,
                    tool: s.recommendedTool,
                    neuralProvider: s.neuralProvider,
                    workflowStepId: s.id,
                  },
                  rationale: s.toolReasoning,
                  expectedOutcome: s.description,
                })),
                rawPlan: JSON.stringify(workflowProposal, null, 2),
                retries: 0,
                executionSuccess: true, // Proposal was successfully generated
                sceneSnapshot: sceneSnapshotResult.summary,
                strategyDecision,
              }
            } catch (workflowError) {
              console.error("Workflow proposal failed, falling back to planner:", workflowError)
              // Fall through to the procedural planner+executor below
            }
          }

          // ── Procedural → Direct v2 agent (replaces legacy planner+executor) ──
          if (!planningMetadata) {

            try {
              monitor.startTimer("agent_execution")
              monitor.info("agent", "Starting direct v2 agent execution (no planner)")

              // Build context-enriched prompt
              let agentPrompt = message
              if (sceneSnapshotResult.summary) {
                agentPrompt = `Current Scene:\n${sceneSnapshotResult.summary}\n\nRequest: ${message}`
              }
              if (researchContext?.promptContext) {
                agentPrompt += `\n\nWeb Research Context:\n${researchContext.promptContext}`
              }

              // ── CRAG: Corrective RAG with batch LLM grading ──
              // Search BOTH blender-scripts AND tool-guides sources, then grade
              // all documents in a single LLM call (1 API call, not N).
              // Falls back to bare similarity search if CRAG fails.
              ragDocCount = 0
              try {
                monitor.startTimer("rag_search")
                console.log(`[CRAG] Searching both sources for: "${message.slice(0, 80)}..."`)

                const { correctiveRetrieve } = await import("@/lib/ai/crag")

                // Search both vectorstore sources in parallel with 15s timeout
                const cragPromise = Promise.all([
                  correctiveRetrieve(message, {
                    topK: 4,
                    source: "blender-scripts",
                    minSimilarity: 0.3,
                    minRelevantDocs: 1,
                    monitor,
                  }),
                  correctiveRetrieve(message, {
                    topK: 3,
                    source: "tool-guides",
                    minSimilarity: 0.3,
                    minRelevantDocs: 1,
                    monitor,
                  }),
                ])
                const timeoutPromise = new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("CRAG search timed out after 15s")), 15_000)
                )

                const [scriptCrag, guideCrag] = await Promise.race([cragPromise, timeoutPromise])

                // Combine: guides first (planning context), then scripts (code examples)
                const allDocs = [...guideCrag.documents, ...scriptCrag.documents]
                ragDocCount = allDocs.length

                console.log(
                  `[CRAG] Scripts: ${scriptCrag.totalRetrieved} retrieved → ${scriptCrag.totalRelevant} relevant` +
                  ` | Guides: ${guideCrag.totalRetrieved} retrieved → ${guideCrag.totalRelevant} relevant` +
                  ` | Total injected: ${ragDocCount}`
                )

                // Log individual document grades for debugging
                for (const doc of scriptCrag.documents) {
                  console.log(`  [CRAGScript] ${doc.grade} (sim: ${doc.similarity.toFixed(3)}) — ${doc.source ?? "unknown"} — ${doc.gradeReason}`)
                }
                for (const doc of guideCrag.documents) {
                  console.log(`  [CRAG Guide]  ${doc.grade} (sim: ${doc.similarity.toFixed(3)}) — ${doc.source ?? "unknown"} — ${doc.gradeReason}`)
                }

                if (allDocs.length > 0) {
                  const ragContext = formatContextFromSources(allDocs)
                  agentPrompt += `\n\n${ragContext}`
                }

                monitor.info("rag", `CRAG injected ${ragDocCount} relevant docs`, {
                  scripts: {
                    retrieved: scriptCrag.totalRetrieved,
                    relevant: scriptCrag.totalRelevant,
                    fallback: scriptCrag.usedFallback,
                  },
                  guides: {
                    retrieved: guideCrag.totalRetrieved,
                    relevant: guideCrag.totalRelevant,
                    fallback: guideCrag.usedFallback,
                  },
                })
                monitor.trackRAGRetrieval(
                  scriptCrag.totalRetrieved + guideCrag.totalRetrieved,
                  ragDocCount,
                  scriptCrag.usedFallback || guideCrag.usedFallback
                )
                monitor.endTimer("rag_search")
              } catch (ragError) {
                console.warn(`[CRAG] Failed, falling back to similarity search:`, ragError)
                monitor.warn("rag", `CRAG failed, using similarity fallback: ${ragError instanceof Error ? ragError.message : String(ragError)}`)

                // Fallback: bare similarity search (no grading) so agent still gets context
                try {
                  const { similaritySearch } = await import("@/lib/ai/vectorstore")
                  const [scripts, guides] = await Promise.all([
                    similaritySearch(message, { limit: 5, source: "blender-scripts", minSimilarity: 0.3 }),
                    similaritySearch(message, { limit: 5, source: "tool-guides", minSimilarity: 0.3 }),
                  ])
                  const fallbackDocs = [...guides, ...scripts]
                  ragDocCount = fallbackDocs.length
                  if (fallbackDocs.length > 0) {
                    agentPrompt += `\n\n${formatContextFromSources(fallbackDocs)}`
                  }
                  console.log(`[RAG Fallback] Injected ${ragDocCount} docs without grading`)
                } catch (fallbackErr) {
                  console.warn(`[RAG Fallback] Also failed:`, fallbackErr)
                }
              }

              // Diagnostic: log LangSmith env vars to confirm they're loaded
              console.log("[LangSmith] Config:", {
                tracing: process.env.LANGSMITH_TRACING,
                endpoint: process.env.LANGSMITH_ENDPOINT ?? "(default)",
                project: process.env.LANGSMITH_PROJECT,
                apiKeySet: !!process.env.LANGSMITH_API_KEY,
              })

              // Create the v2 LangGraph agent directly — it has:
              // - RAG context already injected into agentPrompt above
              // - Updated system prompt with all direct MCP tools
              // - ReAct loop for autonomous tool selection
              const { createBlenderAgentV2 } = await import("@/lib/ai/agents")
              const handleAgentStreamEvent = (event: AgentStreamEvent) => {
                if (event.type === "agent:tool_call") {
                  recordToolEvent(event)
                }
                send(event)
              }
              const agent = createBlenderAgentV2({
                allowPolyHaven: assetConfig.allowPolyHaven,
                allowSketchfab: assetConfig.allowSketchfab,
                allowHyper3d: assetConfig.allowHyper3d,
                useRAG: false, // RAG already done above
                onStreamEvent: handleAgentStreamEvent,
              })

              // ── Pre-inject scene state so agent is always scene-aware ──
              // The agent often ignores the "call get_scene_info first" instruction,
              // so we call it proactively and prepend the result to the prompt.
              try {
                const { executeMcpCommand } = await import("@/lib/ai/agents")
                const sceneInfoRaw = await executeMcpCommand("get_scene_info")
                const sceneInfo = JSON.parse(sceneInfoRaw)
                if (!sceneInfo.error) {
                  const scenePrefix = `## Current Scene State (auto-injected)\n` +
                    `The following is the CURRENT scene state from Blender. Use this to understand what already exists before making changes.\n` +
                    `If there are default objects (e.g. "Cube", "Light", "Camera") that should be removed for a fresh scene, delete them.\n\n` +
                    `\`\`\`json\n${JSON.stringify(sceneInfo, null, 2)}\n\`\`\`\n\n`
                  agentPrompt = scenePrefix + agentPrompt
                  console.log(`[AGENT] Pre-injected scene info: ${Object.keys(sceneInfo).length} keys`)
                }
              } catch (sceneErr) {
                console.warn(`[AGENT] Failed to pre-inject scene info:`, sceneErr)
              }

              // Use a unique thread_id to avoid stale MemorySaver state from
              // prior planner sessions that wrote to the same projectId
              const threadId = `${projectId}-${Date.now()}`
              console.log(`[AGENT] Invoking v2 agent, thread_id=${threadId}, prompt length=${agentPrompt.length}`)

              // Build multimodal content when image attachments are present
              const hasImageAttachments = attachments && attachments.length > 0
              const messageContent = hasImageAttachments
                ? [
                    { type: "text" as const, text: agentPrompt },
                    ...attachments.map(a => ({
                      type: "image_url" as const,
                      // a.data is already a full data URL from FileReader.readAsDataURL()
                      // e.g. "data:image/png;base64,iVBOR..."
                      image_url: { url: a.data },
                    })),
                  ]
                : agentPrompt

              if (hasImageAttachments) {
                console.log(`[AGENT] Sending ${attachments.length} image(s) as multimodal content`)
              }

              // Emit planning_start so the UI activates the "Thinking…" indicator
              send({
                type: "agent:planning_start",
                timestamp: new Date().toISOString(),
              })

              const agentResult = await agent.invoke(
                {
                  messages: [{ role: "user" as const, content: messageContent }],
                },
                {
                  configurable: { thread_id: threadId },
                  recursionLimit: 50,
                  runName: "blender-agent",
                  tags: ["modelforge", studioStep ? "studio" : "autopilot"],
                  metadata: {
                    projectId,
                    conversationId: resolvedConversationId,
                    strategy: strategyDecision.strategy,
                  },
                }
              )

              monitor.endTimer("agent_execution")
              const toolTrace = getToolTrace()

              // Extract messages from agent result
              const agentMessages = agentResult.messages ?? []
              if (toolTrace.length > 0) {
                executedCommands = buildExecutedCommandsFromToolTrace(toolTrace)
              } else {
                const toolCallMessages = agentMessages.filter(
                  (m: unknown) => {
                    if (!m || typeof m !== "object") return false
                    const msg = m as { _getType?: () => string; tool_calls?: unknown[] }
                    const msgType = typeof msg._getType === "function" ? msg._getType.call(msg) : undefined
                    return msgType === "ai" &&
                      Array.isArray(msg.tool_calls) &&
                      (msg.tool_calls?.length ?? 0) > 0
                  }
                )

                for (const msg of toolCallMessages) {
                  const aiMsg = msg as { tool_calls?: Array<{ name: string; args: Record<string, unknown> }> }
                  for (const tc of aiMsg.tool_calls ?? []) {
                    const args = tc.args ?? {}
                    console.log(`[Agent] Tool: ${tc.name} | Args: ${JSON.stringify(args)}`)
                    executedCommands.push({
                      id: createStubId(),
                      tool: tc.name,
                      description: `Agent called ${tc.name}`,
                      status: "executed",
                      confidence: 0.8,
                      arguments: args,
                    })
                  }
                }
              }

              const agentSuccess = executedCommands.some((command) => command.status === "executed")
              monitor.info("agent", `Agent complete: ${executedCommands.length} tool calls`, {
                tools: (toolTrace.length > 0 ? toolTrace : executedCommands).map((entry) => ({
                  name: entry.tool,
                  status: "status" in entry ? entry.status : "completed",
                  args: summarizeToolArgsForMonitor("args" in entry ? entry.args : entry.arguments),
                })),
                success: agentSuccess,
                skippedDuplicates: toolTrace.filter((entry) => entry.status === "skipped").length,
              })

              planningMetadata = {
                planSummary: `Direct agent execution: ${executedCommands.length} tool calls`,
                planSteps: executedCommands.map((c, i) => ({
                  stepNumber: i + 1,
                  action: c.tool,
                  parameters: c.arguments,
                  rationale: c.description,
                  expectedOutcome: `Tool ${c.tool} executed`,
                })),
                rawPlan: JSON.stringify(toolTrace.length > 0 ? toolTrace : executedCommands, null, 2),
                retries: 0,
                executionSuccess: agentSuccess,
                executionLog: executionLogs.length > 0 ? executionLogs : undefined,
                sceneSnapshot: sceneSnapshotResult.summary,
                researchSummary: researchContext?.promptContext,
                researchSources: researchContext?.sources,
                strategyDecision,
              }
            } catch (error) {
              monitor.error("agent", "Agent execution error", {
                error: error instanceof Error ? error.message : String(error),
              })
              console.error("[AGENT] Execution error (full stack):", error)
              if (error instanceof Error && error.stack) {
                console.error("[AGENT] Stack trace:", error.stack)
              }
              // Write full crash trace to file for reliable debugging
              try {
                const crashTrace = [
                  `=== AGENT CRASH TRACE ===`,
                  `Timestamp: ${new Date().toISOString()}`,
                  `Error: ${error instanceof Error ? error.message : String(error)}`,
                  `Type: ${error?.constructor?.name ?? typeof error}`,
                  `Stack: ${error instanceof Error ? error.stack : "N/A"}`,
                  `Full object: ${JSON.stringify(error, Object.getOwnPropertyNames(error instanceof Error ? error : {}), 2)}`,
                  `========================`,
                ].join("\n")
                const fs = await import("fs")
                const path = await import("path")
                fs.writeFileSync(path.join(process.cwd(), "logs", "crash-trace.txt"), crashTrace, "utf-8")
                console.log("[AGENT] Crash trace written to logs/crash-trace.txt")
              } catch { /* ignore write errors */ }
              const messageText =
                error instanceof Error ? error.message : "Unknown agent error"
              const toolTrace = getToolTrace()
              if (toolTrace.length > 0) {
                executedCommands = buildExecutedCommandsFromToolTrace(toolTrace, messageText)
                monitor.info("agent", `Agent interrupted after ${toolTrace.length} tool calls`, {
                  tools: toolTrace.map((entry) => ({
                    name: entry.tool,
                    status: entry.status,
                    args: summarizeToolArgsForMonitor(entry.args),
                  })),
                  completed: toolTrace.filter((entry) => entry.status === "completed").length,
                  failed: toolTrace.filter((entry) => entry.status === "failed").length,
                  skipped: toolTrace.filter((entry) => entry.status === "skipped").length,
                })
              }
              planningMetadata = planningMetadata ?? {
                planSummary: toolTrace.length > 0 ? `Agent error after ${toolTrace.length} tool calls` : "Agent error",
                planSteps: executedCommands.map((c, i) => ({
                  stepNumber: i + 1,
                  action: c.tool,
                  parameters: c.arguments,
                  rationale: c.description,
                  expectedOutcome: c.status === "executed" ? `Tool ${c.tool} executed` : `Tool ${c.tool} failed`,
                })),
                rawPlan: toolTrace.length > 0 ? JSON.stringify(toolTrace, null, 2) : "",
                retries: 0,
                executionSuccess: false,
                errors: [messageText],
                fallbackUsed: false,
                executionLog: executionLogs.length > 0 ? executionLogs : undefined,
                sceneSnapshot: sceneSnapshotResult.summary,
                researchSummary: researchContext?.promptContext,
                researchSources: researchContext?.sources,
              }
              if (toolTrace.length === 0) {
                executedCommands = []
              }
            }
          } // ← closing brace for procedural block



          if (!planningMetadata) {
            planningMetadata = {
              planSummary: "No execution plan generated",
              planSteps: [],
              rawPlan: "",
              retries: 0,
              executionSuccess: false,
              fallbackUsed: false,
              executionLog: executionLogs,
              sceneSnapshot: sceneSnapshotResult.summary,
              researchSummary: researchContext?.promptContext,
              researchSources: researchContext?.sources,
            }
          }

          const failedCommands = executedCommands.filter((command) => command.status === "failed")
          const overallSuccess =
            planningMetadata.executionSuccess ?? failedCommands.length === 0

          // ── Generate post-execution summary + follow-up ──
          try {
            const completedList = executedCommands
              .filter(c => c.status === "executed")
              .map(c => c.tool)
              .join(", ")
            const failedList = failedCommands
              .map(c => `${c.tool}: ${c.error?.substring(0, 80)}`)
              .join("; ")

            // Friendly tool summary grouped by action type for human-readable follow-up
            const friendlyToolMap: Record<string, string> = {
              execute_code: "ran Python code",
              set_camera_properties: "set up the camera",
              get_viewport_screenshot: "captured a viewport screenshot",
              add_light: "added lighting",
              set_light_properties: "configured lighting",
              set_render_settings: "configured render settings",
              get_scene_info: "analyzed the scene",
              get_object_info: "inspected an object",
              get_all_object_info: "inspected all objects",
              add_camera: "added a camera",
              delete_object: "cleaned up the scene",
              create_material: "created materials",
              assign_material: "applied materials",
              set_object_transform: "positioned objects",
              add_modifier: "added modifiers",
              apply_modifier: "applied modifiers",
              shade_smooth: "set smooth shading",
              rename_object: "renamed objects",
              duplicate_object: "duplicated objects",
              move_to_collection: "organized the scene",
              parent_set: "set up object hierarchy",
              join_objects: "joined objects together",
              export_object: "exported a model",
              render_image: "rendered an image",
              get_local_asset_library_status: "checked the local asset library",
              search_local_assets: "searched local assets",
              import_local_asset: "imported local assets",
              search_polyhaven_assets: "searched PolyHaven",
              download_polyhaven_asset: "downloaded assets",
              set_texture: "applied textures",
              list_materials: "listed materials",
            }

            // Group and deduplicate friendly labels
            const executedTools = executedCommands.filter(c => c.status === "executed")
            const labelCounts = new Map<string, number>()
            for (const c of executedTools) {
              const label = friendlyToolMap[c.tool] || c.tool.replace(/_/g, " ")
              labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
            }
            const groupedLabels = [...labelCounts.entries()]
              .map(([label, count]) => count > 1 ? `${label} (${count}×)` : label)

            const humanReadableSummary = groupedLabels.length > 0
              ? groupedLabels.join(", ")
              : "no tools were used"

            console.log("[Chat] Generating post-execution follow-up...", {
              overallSuccess,
              executedCommandsCount: executedCommands.length,
              humanReadableSummary,
              providerType: llmProvider.type,
            })

            const summaryPromptText = overallSuccess
              ? `You just finished building a scene in Blender for the user. Here is the context:\n- User's original request: "${message}"\n- What you did: ${humanReadableSummary}\n\nWrite a conversational 2-3 sentence summary describing what you built or changed in the scene — focus on what the user can see (objects, lighting, materials, composition), NOT on tool names. Then ask ONE specific, creative follow-up question about what the user might want to adjust or add next — reference specific visual elements you created (e.g. "Would you like me to add some warm volumetric lighting behind the awning?" or "I could add a weathered texture to the wood — want me to try that?"). Do NOT be generic or list tool names.`
              : `You attempted a Blender task but some steps failed.\n- User's request: "${message}"\n- What succeeded: ${humanReadableSummary || "nothing"}\n- What failed: ${failedList || "unknown"}\n\nExplain briefly what went wrong (1-2 sentences, in plain language). Then suggest a specific, actionable next step the user could try.`

            const followUpSystemPrompt = "You are ViperMesh, a friendly and knowledgeable Blender 3D assistant. Respond conversationally in 2-4 sentences. Never use markdown headers, bullet points, or tool/function names. Describe the scene visually — what it looks like, not what tools were called. Be warm and creative with your follow-up suggestion."

            let followUpText = ""
            let chunkCount = 0
            try {
              for await (const chunk of streamLlmResponse(llmProvider, {
                history: [],
                messages: [{ role: "user", content: summaryPromptText }],
                maxOutputTokens: 300,
                temperature: 0.6,
                systemPrompt: followUpSystemPrompt,
              })) {
                chunkCount++
                if (chunk.textDelta) {
                  followUpText += chunk.textDelta
                  send({ type: "followup_delta", delta: chunk.textDelta })
                }
              }
            } catch (streamErr) {
              console.warn("[Chat] Follow-up stream error (will retry non-streaming):", streamErr instanceof Error ? streamErr.message : String(streamErr))
            }

            console.log("[Chat] Follow-up stream result:", followUpText.length, "chars,", chunkCount, "chunks")

            // If streaming returned empty, retry with non-streaming generateLlmResponse
            if (!followUpText.trim()) {
              console.warn("[Chat] Follow-up stream was empty — retrying with non-streaming call")
              try {
                const nonStreamResult = await generateLlmResponse(llmProvider, {
                  history: [],
                  messages: [{ role: "user", content: summaryPromptText }],
                  maxOutputTokens: 300,
                  temperature: 0.6,
                  systemPrompt: followUpSystemPrompt,
                })
                if (nonStreamResult.text?.trim()) {
                  followUpText = nonStreamResult.text.trim()
                  send({ type: "followup_delta", delta: followUpText })
                  console.log("[Chat] Non-streaming follow-up succeeded:", followUpText.length, "chars")
                }
              } catch (genErr) {
                console.warn("[Chat] Non-streaming follow-up also failed:", genErr instanceof Error ? genErr.message : String(genErr))
              }
            }

            // Append follow-up to assistant text so BOTH the initial response
            // and the follow-up are preserved when saved to DB
            if (followUpText.trim()) {
              assistantText = (assistantText || "").trimEnd() + "\n\n" + followUpText.trim()
            } else {
              // Both streaming AND non-streaming failed — generate a scene-aware fallback
              // from the user's prompt, NOT from tool names
              console.warn("[Chat] Both follow-up methods failed, using scene-aware fallback from user prompt")
              const userPromptPreview = message.length > 80 ? message.substring(0, 80) + "..." : message
              const emptyFallback = overallSuccess
                ? `Your scene is ready! I set everything up based on your request. What would you like to adjust or add next?`
                : `Some steps didn't go as planned. Would you like me to retry with a different approach?`
              send({ type: "followup_delta", delta: emptyFallback })
              assistantText = emptyFallback
            }
          } catch (followUpError) {
            console.error("[Chat] Post-execution follow-up generation FAILED:", followUpError)
            const errMsg = followUpError instanceof Error ? followUpError.message : String(followUpError)
            // Scene-aware error fallback — no tool names
            const fallbackText = overallSuccess
              ? `Your scene is ready! What would you like to adjust or add next?`
              : `The execution ran into some issues. Would you like me to try a different approach?`
            send({ type: "followup_delta", delta: `\n\n${fallbackText}` })
            assistantText += `\n\n${fallbackText}`
            monitor.error("system", `Follow-up generation failed: ${errMsg}`)
          }

          await recordExecutionLog({
            timestamp: new Date().toISOString(),
            conversationId: resolvedConversationId,
            userId: session.user.id,
            projectId,
            request: message,
            planSummary: planningMetadata.planSummary,
            planSteps: planningMetadata.planSteps.length,
            success: overallSuccess,
            fallbackUsed: planningMetadata.fallbackUsed ?? false,
            planRetries: planningMetadata.retries,
            failedCommands: failedCommands.map((command) => ({
              id: command.id,
              tool: command.tool,
              error: command.error,
            })),
            commandCount: executedCommands.length,
            planErrors: planningMetadata.errors,
            tokenUsage,
            executionLog: planningMetadata.executionLog,
            sceneSummary: planningMetadata.sceneSnapshot ?? sceneSnapshotResult.summary,
            researchSummary: planningMetadata.researchSummary,
          })


          const result = await prisma.$transaction(async (tx) => {
            const userMessageRecord = await tx.message.create({
              data: {
                conversationId: resolvedConversationId,
                role: "user",
                content: message,
                mcpResults: { workflowMode: currentMode } as unknown as Prisma.InputJsonValue,
              },
              select: {
                id: true,
                role: true,
                content: true,
                createdAt: true,
              },
            })

            const assistantMessageRecord = await tx.message.create({
              data: {
                conversationId: resolvedConversationId,
                role: "assistant",
                content: assistantText,
                mcpCommands: executedCommands as unknown as Prisma.InputJsonValue,
                mcpResults: {
                  workflowMode: currentMode,
                  tokens: tokenUsage,
                  plan: planningMetadata ?? undefined,
                  commands: executedCommands.map((command) => ({
                    id: command.id,
                    tool: command.tool,
                    status: command.status,
                    result: command.result,
                    error: command.error,
                  })),
                } as unknown as Prisma.InputJsonValue,
              },
              select: {
                id: true,
                role: true,
                content: true,
                mcpCommands: true,
                createdAt: true,
              },
            })

            await tx.conversation.update({
              where: { id: resolvedConversationId },
              data: { lastMessageAt: assistantMessageRecord.createdAt },
            })

            return { userMessageRecord, assistantMessageRecord }
          })

          await logUsage({
            userId: session.user.id,
            projectId,
            requestType: "ai_request",
            tokensUsed: tokenUsage?.totalTokens ?? undefined,
          })

          const usage = await getUsageSummary(
            session.user.id,
            session.user.subscriptionTier
          )

          // Emit monitoring summary
          monitor.endTimer("total_pipeline")
          const summary = monitor.getSummary()
          monitor.info("system", `Pipeline complete: ${summary.counts.error} errors, ${Object.keys(summary.timers).length} timed stages`, {
            totalDurationMs: summary.totalDurationMs,
            timers: summary.timers,
            counts: summary.counts,
          })
          send({
            type: "agent:monitoring_summary",
            timestamp: new Date().toISOString(),
            summary,
          })
          monitor.persistSummary()

          send({
            type: "complete",
            conversationId: resolvedConversationId,
            messages: [result.userMessageRecord, result.assistantMessageRecord],
            usage,
            tokenUsage,
            commandSuggestions: executedCommands,
            planning: planningMetadata,
            ragDocCount,
          })
        } catch (error) {
          monitor.error("system", "AI chat stream error", {
            error: error instanceof Error ? error.message : String(error),
          })
          monitor.endTimer("total_pipeline")
          monitor.persistSummary()
          console.error("AI chat stream error:", error)
          send({
            type: "error",
            error:
              error instanceof Error
                ? error.message
                : "Failed to process AI request",
          })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("AI chat error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.flatten() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process AI request" },
      { status: 500 }
    )
  }
}
