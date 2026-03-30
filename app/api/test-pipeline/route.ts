/**
 * Test Pipeline Route — DEV ONLY
 *
 * Runs the FULL pipeline (RAG → Plan → Code Gen → MCP Execute) without auth.
 * Use this for A/B testing LLM providers (Gemini vs Claude).
 *
 * Usage:
 *   # Plan + Generate + Execute in Blender
 *   curl -X POST http://localhost:8081/api/test-pipeline \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Create a low-poly medieval sword"}'
 *
 *   # Plan + Generate only (skip Blender execution)
 *   curl -X POST http://localhost:8081/api/test-pipeline \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Create a chair", "skipExecution": true}'
 *
 *   # Quick GET
 *   curl "http://localhost:8081/api/test-pipeline?prompt=Create+a+chair"
 *
 * Returns JSON with plan, code, execution results, and timing info.
 */

import { NextRequest, NextResponse } from "next/server"
import { generatePlan, generateCode } from "@/lib/ai/chains"
import { correctiveRetrieve } from "@/lib/ai/crag"
import { formatContextFromSources } from "@/lib/ai/rag"
import { createMcpClient, checkMcpConnection } from "@/lib/mcp"
import { agentMonitor } from "@/lib/agent-monitor"

// Define the tools available (same as BlenderAgent)
const MCP_TOOLS = [
  "get_scene_info",
  "get_object_info",
  "get_all_object_info",
  "get_viewport_screenshot",
  "execute_code",
  "get_local_asset_library_status",
  "search_local_assets",
  "import_local_asset",
  "get_polyhaven_status",
  "get_polyhaven_categories",
  "search_polyhaven_assets",
  "download_polyhaven_asset",
  "set_texture",
  "get_hyper3d_status",
  "create_rodin_job",
  "poll_rodin_job_status",
  "import_generated_asset",
  "get_sketchfab_status",
  "search_sketchfab_models",
  "download_sketchfab_model",
]

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Test endpoint disabled in production" }, { status: 403 })
  }

  const prompt = req.nextUrl.searchParams.get("prompt")
  if (!prompt) {
    return NextResponse.json({
      error: "Missing ?prompt= parameter",
      usage: "curl 'http://localhost:8081/api/test-pipeline?prompt=Create+a+low-poly+chair'",
    }, { status: 400 })
  }

  const skipExecution = req.nextUrl.searchParams.get("skipExecution") === "true"
  return runPipeline(prompt, skipExecution)
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Test endpoint disabled in production" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as { prompt?: string; skipExecution?: boolean; provider?: string }
  const prompt = body.prompt
  if (!prompt) {
    return NextResponse.json({ error: "Missing 'prompt' in body" }, { status: 400 })
  }

  return runPipeline(prompt, body.skipExecution ?? false, body.provider)
}

async function runPipeline(prompt: string, skipExecution = false, providerOverride?: string) {
  const provider = (providerOverride ?? process.env.AI_PROVIDER ?? "gemini").toLowerCase()
  const model = provider === "anthropic" || provider === "claude"
    ? (process.env.ANTHROPIC_MODEL ?? "claude-opus-4-6")
    : (process.env.GEMINI_MODEL ?? "gemini-3.1-pro-preview")
  const timings: Record<string, number> = {}
  const results: Record<string, unknown> = {}

  // Start monitor session
  const sessionId = `test-${Date.now()}`
  agentMonitor.startSession(sessionId, prompt, provider, model)

  try {
    // ── Step 0: Check Blender MCP connection ──────────────────
    let mcpConnected = false
    let sceneState = JSON.stringify({
      scene: "Scene",
      objects: [
        { name: "Camera", type: "CAMERA" },
        { name: "Light", type: "LIGHT" },
      ],
    })

    if (!skipExecution) {
      console.log(`[TEST] Checking Blender MCP connection...`)
      const connCheck = await checkMcpConnection()
      mcpConnected = connCheck.connected
      results.mcpConnection = connCheck

      if (!mcpConnected) {
        console.log(`[TEST] ⚠ Blender not connected: ${connCheck.error}`)
        console.log(`[TEST] Continuing with plan+codegen only (no execution)`)
        results.mcpWarning = "Blender addon not connected — skipping execution"
      } else {
        console.log(`[TEST] ✓ Blender connected on port 9876`)
        // Get real scene info
        try {
          const client = createMcpClient()
          const sceneInfo = await client.execute({
            type: "get_scene_info",
            params: {},
          })
          sceneState = JSON.stringify(sceneInfo.result ?? sceneInfo)
          results.sceneStateBefore = sceneInfo.result ?? sceneInfo
          console.log(`[TEST] Scene state: ${sceneState.slice(0, 200)}`)
          await client.close()
        } catch (sceneErr) {
          console.log(`[TEST] Could not get scene info: ${sceneErr}`)
        }
      }
    }

    // ── Step 1: CRAG Retrieval (Corrective RAG) ──────────────
    let ragContext = ""
    const ragStart = Date.now()
    try {
      agentMonitor.log(sessionId, "rag:search", {
        query: prompt.slice(0, 100),
        limit: 8,
        source: "blender-scripts",
      })

      const cragResult = await correctiveRetrieve(prompt, {
        topK: 8,
        source: "blender-scripts",
        minSimilarity: 0.4,
        minRelevantDocs: 2,
      })

      ragContext = formatContextFromSources(cragResult.documents)
      timings.rag_ms = Date.now() - ragStart

      const docSummaries = cragResult.documents.map(d => ({
        title: (d.metadata as Record<string, unknown>)?.title ?? d.source ?? "unknown",
        grade: d.grade,
        similarity: d.similarity?.toFixed(3),
        reason: d.gradeReason,
      }))

      results.rag = {
        documentsFound: cragResult.totalRetrieved,
        documentsRelevant: cragResult.totalRelevant,
        usedFallback: cragResult.usedFallback,
        contextLength: ragContext.length,
        sources: docSummaries,
      }

      agentMonitor.log(sessionId, "crag:filter", {
        totalRetrieved: cragResult.totalRetrieved,
        relevant: cragResult.totalRelevant,
        total: cragResult.documents.length,
        usedFallback: cragResult.usedFallback,
        docs: docSummaries,
      }, timings.rag_ms)
    } catch (ragErr) {
      timings.rag_ms = Date.now() - ragStart
      results.rag = { error: String(ragErr) }
      agentMonitor.log(sessionId, "pipeline:error", { stage: "crag", error: String(ragErr) })
    }

    // ── Step 2: Plan Generation ──────────────────────────────
    const planStart = Date.now()
    agentMonitor.log(sessionId, "plan:start", { promptChars: prompt.length, contextChars: ragContext.length })
    const planResult = await generatePlan({
      request: prompt,
      tools: MCP_TOOLS,
      context: ragContext,
      sceneState,
    })
    timings.plan_ms = Date.now() - planStart

    agentMonitor.log(sessionId, "plan:steps", {
      stepCount: planResult.plan.steps.length,
      summary: planResult.plan.steps.map((s, i) => `${i + 1}. ${s.action}: ${s.rationale.slice(0, 80)}`).join("\n"),
    }, timings.plan_ms)

    results.plan = {
      steps: planResult.plan.steps.map((s, i) => ({
        step: i + 1,
        action: s.action,
        rationale: s.rationale,
        expected_outcome: s.expected_outcome,
        hasCode: !!s.parameters?.code,
        hasDescription: !!s.parameters?.description,
        parameters: s.parameters,
      })),
      dependencies: planResult.plan.dependencies,
      warnings: planResult.plan.warnings,
      reasoning: planResult.reasoning?.slice(0, 500),
    }

    // ── Step 3: Code Generation for each execute_code step ──
    const codeSteps = planResult.plan.steps.filter(s => s.action === "execute_code")
    const generatedCodes: { description: string; code: string; lines: number }[] = []

    for (const [idx, codeStep] of codeSteps.entries()) {
      const codeDescription = typeof codeStep.parameters?.description === "string"
        ? codeStep.parameters.description
        : typeof codeStep.parameters?.code === "string"
          ? codeStep.parameters.code // already has inline code
          : codeStep.rationale ?? codeStep.expected_outcome ?? prompt

      // If the planner already provided code, use it directly
      if (typeof codeStep.parameters?.code === "string") {
        const code = codeStep.parameters.code as string
        generatedCodes.push({ description: codeDescription, code, lines: code.split("\n").length })
        console.log(`[TEST] Step ${idx + 1}/${codeSteps.length}: Using inline code (${code.split("\n").length} lines)`)
        continue
      }

      const codeStart = Date.now()
      agentMonitor.log(sessionId, "codegen:start", { step: idx + 1, descriptionChars: codeDescription.length })
      const code = await generateCode({
        request: codeDescription,
        context: ragContext,
        applyMaterials: true,
        namingPrefix: "ModelForge_",
      })
      const codeMs = Date.now() - codeStart
      timings[`codegen_step${idx + 1}_ms`] = codeMs
      generatedCodes.push({ description: codeDescription, code, lines: code.split("\n").length })
      agentMonitor.log(sessionId, "codegen:complete", { step: idx + 1, lines: code.split("\n").length, chars: code.length }, codeMs)
    }

    results.code = generatedCodes.map((gc, i) => ({
      step: i + 1,
      description: gc.description.slice(0, 200),
      lines: gc.lines,
      length: gc.code.length,
      snippet: gc.code.slice(0, 2000),
      full: gc.code,
    }))

    // Print the first code block to console
    if (generatedCodes.length > 0) {
      const mainCode = generatedCodes[0].code
      console.log(`\n--- Generated Code (first 80 lines) ---`)
      mainCode.split("\n").slice(0, 80).forEach((line, i) => console.log(`  ${String(i + 1).padStart(3)}: ${line}`))
      if (mainCode.split("\n").length > 80) console.log(`  ... (${mainCode.split("\n").length - 80} more lines)`)
      console.log(`--- End Code ---\n`)
    }

    // ── Step 4: Execute in Blender via MCP ──────────────────
    const executionResults: { step: number; status: string; output?: unknown; error?: string; time_ms: number }[] = []

    if (!skipExecution && mcpConnected && generatedCodes.length > 0) {
      console.log(`[TEST] 🚀 Executing ${generatedCodes.length} code block(s) in Blender...`)
      const client = createMcpClient()

      for (const [idx, gc] of generatedCodes.entries()) {
        const execStart = Date.now()
        try {
          agentMonitor.log(sessionId, "mcp:execute", { step: idx + 1, command: "execute_code", codeChars: gc.code.length })
          const execResult = await client.execute({
            type: "execute_code",
            params: { code: gc.code },
          })
          const execMs = Date.now() - execStart
          timings[`exec_step${idx + 1}_ms`] = execMs

          const stepResult = {
            step: idx + 1,
            status: execResult.status ?? "unknown",
            output: execResult.result ?? execResult.message,
            time_ms: execMs,
          }
          executionResults.push(stepResult)
          agentMonitor.log(sessionId, "mcp:result", { step: idx + 1, status: stepResult.status, result: JSON.stringify(stepResult.output).slice(0, 200) }, execMs)
        } catch (execErr) {
          const execMs = Date.now() - execStart
          timings[`exec_step${idx + 1}_ms`] = execMs
          const errMsg = execErr instanceof Error ? execErr.message : String(execErr)
          executionResults.push({ step: idx + 1, status: "error", error: errMsg, time_ms: execMs })
          agentMonitor.log(sessionId, "mcp:error", { step: idx + 1, error: errMsg }, execMs)
        }
      }

      // Get final scene state
      try {
        const finalScene = await client.execute({
          type: "get_scene_info",
          params: {},
        })
        results.sceneStateAfter = finalScene.result ?? finalScene
        console.log(`[TEST] Final scene: ${JSON.stringify(results.sceneStateAfter).slice(0, 300)}`)
      } catch {
        console.log(`[TEST] Could not get final scene info`)
      }

      await client.close()
    } else if (!skipExecution && !mcpConnected) {
      console.log(`[TEST] ⏭ Skipped execution — Blender not connected`)
    } else {
      console.log(`[TEST] ⏭ Skipped execution (skipExecution=true)`)
    }

    results.execution = executionResults
    results.monitorSessionId = sessionId

    // ── Summary ──────────────────────────────────────────
    timings.total_ms = Object.values(timings).reduce((a, b) => a + b, 0)
    agentMonitor.completeSession(sessionId, true)

    return NextResponse.json({
      success: true,
      provider,
      model,
      prompt,
      blenderConnected: mcpConnected,
      timings,
      monitorSessionId: sessionId,
      ...results,
    }, { status: 200 })

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    agentMonitor.log(sessionId, "pipeline:error", { error: errorMsg, stack })
    agentMonitor.completeSession(sessionId, false)
    return NextResponse.json({
      success: false,
      provider,
      model,
      prompt,
      error: errorMsg,
      timings,
      monitorSessionId: sessionId,
      ...results,
    }, { status: 500 })
  }
}
