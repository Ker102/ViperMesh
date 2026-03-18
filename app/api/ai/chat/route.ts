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
import { streamLlmResponse, type LlmProviderSpec } from "@/lib/llm"
import type { GeminiMessage } from "@/lib/gemini"
import { createMcpClient } from "@/lib/mcp"
// Legacy planner/executor removed — v2 agent handles tool selection directly
import type {
  ExecutionPlan,
  ExecutionLogEntry,
  PlanGenerationResult,
  PlanStep,
  PlanningMetadata,
  ResearchSource,
} from "@/lib/orchestration/types"
import { recordExecutionLog } from "@/lib/orchestration/monitor"
import { buildSystemPrompt } from "@/lib/orchestration/prompts"
import { searchFirecrawl, type FirecrawlSearchResult } from "@/lib/firecrawl"
import { similaritySearch } from "@/lib/ai/vectorstore"
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

function createStubId() {
  try {
    return randomUUID()
  } catch {
    return `stub-${Date.now()}`
  }
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
})

async function ensureConversation({
  projectId,
  userId,
  conversationId,
  startNew,
}: {
  projectId: string
  userId: string
  conversationId?: string
  startNew?: boolean
}) {
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
    const { projectId, conversationId, startNew, message, useLocalModel, workflowMode, studioStep } =
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
          let executionLogs: ExecutionLogEntry[] | undefined = undefined
          let planResult: PlanGenerationResult | null = null
          let ragDocCount = 0

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

              // ── RAG: Vector search for blender-script references ──
              // Tool-specific domain guides are bound to tool descriptions
              // in agents.ts (see TOOL_GUIDE_MAP). Here we only search the
              // vectorstore for supplemental blender-script code examples.
              ragDocCount = 0
              try {
                monitor.startTimer("rag_search")
                console.log(`[RAG] Searching blender-scripts for: "${message.slice(0, 80)}..."`)

                const searchPromise = similaritySearch(message, { limit: 3, source: "blender-scripts" })
                const timeoutPromise = new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("RAG search timed out after 10s")), 10_000)
                )
                const ragResults = await Promise.race([searchPromise, timeoutPromise])
                ragDocCount = ragResults.length
                console.log(`[RAG] Found ${ragDocCount} script references`)

                if (ragResults.length > 0) {
                  const scriptContext = formatContextFromSources(ragResults)
                  agentPrompt += `\n\n${scriptContext}`
                }

                monitor.info("rag", `Injected ${ragDocCount} script references`, {
                  scriptResults: ragResults.map((r) => ({ source: r.source, similarity: r.similarity.toFixed(3) })),
                })
                monitor.trackRAGRetrieval(ragDocCount, ragDocCount, false)
                monitor.endTimer("rag_search")
              } catch (ragError) {
                console.warn(`[RAG] Non-fatal error:`, ragError)
                monitor.warn("rag", `RAG search failed (non-fatal): ${ragError instanceof Error ? ragError.message : String(ragError)}`)
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
              const agent = createBlenderAgentV2({
                allowPolyHaven: assetConfig.allowPolyHaven,
                allowSketchfab: assetConfig.allowSketchfab,
                allowHyper3d: assetConfig.allowHyper3d,
                useRAG: false, // RAG already done above
                onStreamEvent: (event) => send(event),
              })

              // Use a unique thread_id to avoid stale MemorySaver state from
              // prior planner sessions that wrote to the same projectId
              const threadId = `${projectId}-${Date.now()}`
              console.log(`[AGENT] Invoking v2 agent, thread_id=${threadId}, prompt length=${agentPrompt.length}`)

              const agentResult = await agent.invoke(
                {
                  messages: [{ role: "user" as const, content: agentPrompt }],
                },
                {
                  configurable: { thread_id: threadId },
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

              // Extract tool calls from agent messages for the commands list
              const agentMessages = agentResult.messages ?? []
              const toolCallMessages = agentMessages.filter(
                (m: unknown) => {
                  if (!m || typeof m !== "object") return false
                  const msg = m as { _getType?: () => string; tool_calls?: unknown[] }
                  // Call _getType bound to the message (DO NOT extract the method reference)
                  const msgType = typeof msg._getType === "function" ? msg._getType.call(msg) : undefined
                  return msgType === "ai" &&
                    Array.isArray(msg.tool_calls) &&
                    (msg.tool_calls?.length ?? 0) > 0
                }
              )

              // Build executed commands from agent tool calls
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

              const agentSuccess = toolCallMessages.length > 0
              monitor.info("agent", `Agent complete: ${executedCommands.length} tool calls`, {
                tools: executedCommands.map(c => ({ name: c.tool, args: c.arguments })),
                success: agentSuccess,
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
                rawPlan: JSON.stringify(executedCommands, null, 2),
                retries: 0,
                executionSuccess: agentSuccess,
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
              planningMetadata = planningMetadata ?? {
                planSummary: "Agent error",
                planSteps: [],
                rawPlan: "",
                retries: 0,
                executionSuccess: false,
                errors: [messageText],
                fallbackUsed: false,
                executionLog: executionLogs,
                sceneSnapshot: sceneSnapshotResult.summary,
                researchSummary: researchContext?.promptContext,
                researchSources: researchContext?.sources,
              }
              executedCommands = []
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
              analysis: planResult?.analysis,
              researchSummary: researchContext?.promptContext,
              researchSources: researchContext?.sources,
            }
          }

          const failedCommands = executedCommands.filter((command) => command.status === "failed")
          const overallSuccess =
            planningMetadata.executionSuccess ?? failedCommands.length === 0

          // ── Generate post-execution summary + follow-up ──
          try {
            console.log("[Chat] Generating post-execution follow-up...", { overallSuccess, executedCommandsCount: executedCommands.length })
            const completedList = executedCommands
              .filter(c => c.status === "executed")
              .map(c => c.tool)
              .join(", ")
            const failedList = failedCommands
              .map(c => `${c.tool}: ${c.error?.substring(0, 80)}`)
              .join("; ")

            const summaryPromptText = overallSuccess
              ? `The Blender scene has been created successfully. Commands executed: ${completedList || "none"}. User's original request: "${message}". Write a brief 2-3 sentence summary of what was done, then ask a short follow-up question suggesting a possible refinement or next step (e.g. "Would you like to adjust the lighting?" or "I can add textures if you'd like"). Keep it conversational and helpful.`
              : `The Blender operation partially failed. Succeeded: ${completedList || "none"}. Failed: ${failedList || "none"}. User's request was: "${message}". Write a brief 2-3 sentence summary explaining what happened and what failed. Then suggest what the user could try next. Keep it conversational.`

            let followUpText = ""
            for await (const chunk of streamLlmResponse(llmProvider, {
              history: [],
              messages: [{ role: "user", content: summaryPromptText }],
              maxOutputTokens: 256,
              systemPrompt: "You are ModelForge, a helpful Blender assistant. Respond conversationally. Do NOT use markdown headers. Keep your response to 2-4 sentences.",
            })) {
              if (chunk.textDelta) {
                followUpText += chunk.textDelta
                send({ type: "followup_delta", delta: chunk.textDelta })
              }
            }

            console.log("[Chat] Follow-up generated:", followUpText.length, "chars")

            // Append follow-up to assistant text so BOTH the initial response
            // and the follow-up are preserved when saved to DB
            if (followUpText.trim()) {
              assistantText = (assistantText || "").trimEnd() + "\n\n" + followUpText.trim()
            } else {
              // The LLM yielded 0 chunks — send a fallback so the UI isn't empty
              console.warn("[Chat] Follow-up stream returned empty text, sending fallback")
              const emptyFallback = overallSuccess
                ? `Done! I've completed the task. Would you like me to refine anything?`
                : `The execution encountered some issues. Would you like me to try a different approach?`
              send({ type: "followup_delta", delta: emptyFallback })
              assistantText = emptyFallback
            }
          } catch (followUpError) {
            console.error("[Chat] Post-execution follow-up generation FAILED:", followUpError)
            // Make the error visible in the UI + send a fallback follow-up
            const errMsg = followUpError instanceof Error ? followUpError.message : String(followUpError)
            const fallbackText = overallSuccess
              ? `I've completed the task. Would you like me to refine anything?`
              : `The execution encountered some issues. Would you like me to try a different approach?`
            send({ type: "followup_delta", delta: `\n\n${fallbackText}` })
            assistantText += `\n\n${fallbackText}`
            // Log the error in monitoring for the session log
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
