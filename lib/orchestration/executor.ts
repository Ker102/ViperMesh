/**
 * Plan Executor (v2 — LangChain v1 + LangGraph)
 *
 * Wraps the new LangChain v1 `createAgent`-based Blender agent.
 * The legacy implementation is preserved in executor.legacy.ts.
 *
 * This executor provides the same `PlanExecutor` interface so that
 * the API routes (chat/route.ts, workflow-step/route.ts) can use it
 * as a drop-in replacement.
 */

import { createBlenderAgentV2, type BlenderAgentV2Options } from "@/lib/ai/agents"
import { createMcpClient } from "@/lib/mcp"
import type { ExecutionPlan, ExecutionLogEntry, AgentStreamEvent, PlanStep } from "./types"
import type { StrategyDecision } from "./strategy-types"
import type { LlmProviderSpec } from "@/lib/llm"

// ============================================================================
// Types (compatible with the legacy interface)
// ============================================================================

export interface ExecutionResult {
  success: boolean
  completedSteps: Array<{ step: PlanStep; result: unknown }>
  failedSteps: Array<{ step: PlanStep; error: string }>
  finalSceneState?: unknown
  logs: ExecutionLogEntry[]
}

export interface ExecutionOptions {
  allowHyper3d: boolean
  allowSketchfab: boolean
  allowPolyHaven: boolean
  /** Enable visual feedback loop for scene validation */
  enableVisualFeedback?: boolean
  /** Maximum visual validation iterations per step (default: 3) */
  maxVisualIterations?: number
  /** Callback to stream real-time agent events to the client */
  onStreamEvent?: (event: AgentStreamEvent) => void
  /** Strategy decision from the router */
  strategyDecision?: StrategyDecision
  /** Project ID for session persistence (thread_id) */
  projectId?: string
}

// ============================================================================
// Executor
// ============================================================================

export class PlanExecutor {
  /**
   * Execute a plan using the LangChain v1 agent.
   *
   * The new agent handles the ReAct loop internally — we pass the user
   * request and let createAgent decide how to call tools. The plan steps
   * from the planner are included as context in the prompt.
   */
  async executePlan(
    executionPlan: ExecutionPlan,
    userRequest: string,
    options: ExecutionOptions,
    _analysis?: unknown,
    _llmProvider?: LlmProviderSpec
  ): Promise<ExecutionResult> {
    const logs: ExecutionLogEntry[] = []
    const completedSteps: Array<{ step: PlanStep; result: unknown }> = []
    const failedSteps: Array<{ step: PlanStep; error: string }> = []

    const log = (tool: string, detail: string, logType: ExecutionLogEntry["logType"] = "execute") => {
      logs.push({
        timestamp: new Date().toISOString(),
        tool,
        parameters: {},
        logType,
        detail,
      })
    }

    try {
      log("system", "Initializing LangChain v1 agent", "system")

      // Emit planning event
      options.onStreamEvent?.({
        type: "agent:planning_start",
        timestamp: new Date().toISOString(),
      })

      // ── Addon detection: discover installed addons before creating agent ──
      let detectedAddonModules: string[] | undefined
      try {
        const mcpClient = createMcpClient()
        const addonResponse = await mcpClient.execute({
          type: "list_installed_addons",
          params: {},
        })
        if (addonResponse.status !== "error" && addonResponse.result) {
          const result = addonResponse.result as { addons?: Array<{ module: string }> }
          if (result.addons) {
            detectedAddonModules = result.addons.map((a) => a.module)
            log("system", `Detected ${detectedAddonModules.length} installed addons`, "system")
          }
        }
      } catch {
        // Addon detection is best-effort — don't block execution
        log("system", "Addon detection skipped (connection not available)", "system")
      }

      // Build the v2 agent
      const agentOptions: BlenderAgentV2Options = {
        allowPolyHaven: options.allowPolyHaven,
        allowSketchfab: options.allowSketchfab,
        allowHyper3d: options.allowHyper3d,
        useRAG: true,
        enableAddonDetection: true,
        detectedAddonModules,
        onStreamEvent: options.onStreamEvent,
      }

      const agent = createBlenderAgentV2(agentOptions)

      // Build the prompt with plan context
      const planContext = executionPlan.steps
        .map(
          (step, i) =>
            `Step ${i + 1}: ${step.action} — ${step.rationale}\n  Expected outcome: ${step.expectedOutcome}`
        )
        .join("\n")

      const warningsContext = executionPlan.warnings?.length
        ? `\nWarnings: ${executionPlan.warnings.join("; ")}`
        : ""

      const agentPrompt = [
        `User request: "${userRequest}"`,
        `\nPlanner has produced the following execution plan:`,
        `Plan summary: ${executionPlan.planSummary}`,
        planContext,
        warningsContext,
        `\nExecute this plan step by step. For each step, use the most appropriate tool — ` +
          `prefer direct MCP tools (add_camera, set_camera_properties, add_light, set_render_settings, etc.) over execute_code when available. ` +
          `After each major geometry change, capture a viewport screenshot to verify. ` +
          `If a step fails, attempt recovery before moving on.`,
      ].join("\n")

      // Emit planning complete event
      options.onStreamEvent?.({
        type: "agent:planning_complete",
        timestamp: new Date().toISOString(),
        stepCount: executionPlan.steps.length,
        summary: executionPlan.planSummary,
      })

      log("system", `Agent invoked with ${executionPlan.steps.length} planned steps`, "plan")

      // Invoke the agent — LangGraph handles the ReAct loop internally
      const config: Record<string, unknown> = {}
      if (options.projectId) {
        config.configurable = { thread_id: options.projectId }
      }

      const result = await agent.invoke(
        {
          messages: [{ role: "user" as const, content: agentPrompt }],
        },
        config
      )

      log("system", "Agent execution completed", "system")

      // Map agent result back to the legacy format
      // The agent returns messages — we parse tool calls from the conversation
      const resultMessages = ((result as unknown as Record<string, unknown>).messages as Array<Record<string, unknown>> | undefined) ?? []
      const toolCallMessages = resultMessages.filter(
        (m) => (m.role === "assistant" || (typeof m._getType === "function" && (m._getType as () => string)() === "ai")) && Array.isArray(m.tool_calls) && m.tool_calls.length > 0
      )

      // Build completed/failed steps by matching tool calls to plan steps.
      // Collect all tool names that were actually invoked
      const invokedTools = new Set<string>()
      const failedTools = new Set<string>()
      for (const msg of toolCallMessages) {
        const calls = msg.tool_calls as Array<{ name?: string }> | undefined
        if (calls) {
          for (const call of calls) {
            if (call.name) invokedTools.add(call.name)
          }
        }
      }

      // Also check for tool messages with error status
      const toolResultMessages = resultMessages.filter(
        (m) => (m.role === "tool" || (typeof m._getType === "function" && (m._getType as () => string)() === "tool"))
      )
      for (const msg of toolResultMessages) {
        const status = msg.status as string | undefined
        if (status === "error" && typeof msg.name === "string") {
          failedTools.add(msg.name)
        }
      }

      // Map each plan step to its execution status
      for (const step of executionPlan.steps) {
        const action = (step as PlanStep).action
        if (failedTools.has(action)) {
          failedSteps.push({
            step: step as PlanStep,
            error: `Tool call '${action}' returned an error`,
          })
        } else if (invokedTools.has(action)) {
          completedSteps.push({
            step: step as PlanStep,
            result: { status: "completed_by_agent" },
          })
        } else {
          // No direct tool call evidence for this step — could be handled
          // implicitly via execute_code or not reached
          completedSteps.push({
            step: step as PlanStep,
            result: { status: "not_observed" },
          })
        }
      }

      options.onStreamEvent?.({
        type: "agent:complete",
        timestamp: new Date().toISOString(),
        success: true,
        completedCount: completedSteps.length,
        failedCount: 0,
      })

      return {
        success: true,
        completedSteps,
        failedSteps,
        logs,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log("system", `Agent execution failed: ${errorMessage}`, "system")

      // Mark remaining steps as failed
      for (const step of executionPlan.steps) {
        if (!completedSteps.find((c) => c.step.action === step.action)) {
          failedSteps.push({
            step: step as PlanStep,
            error: errorMessage,
          })
        }
      }

      options.onStreamEvent?.({
        type: "agent:complete",
        timestamp: new Date().toISOString(),
        success: false,
        completedCount: completedSteps.length,
        failedCount: failedSteps.length,
      })

      return {
        success: false,
        completedSteps,
        failedSteps,
        logs,
      }
    }
  }
}
