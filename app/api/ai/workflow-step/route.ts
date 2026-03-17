/**
 * Workflow Step Execution API
 *
 * Handles individual step actions in a guided workflow:
 *   - execute: Run the step using the recommended tool (neural or Blender agent)
 *   - skip: Mark the step as skipped
 *   - manual_done: Mark the step as completed manually by the user
 *
 * POST /api/ai/workflow-step
 * Body: { conversationId, workflowId, stepId, action, userRequest }
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createBlenderAgentV2 } from "@/lib/ai/agents"
import type { WorkflowStepAction, WorkflowStepResult, WorkflowStep } from "@/lib/orchestration/workflow-types"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const RequestSchema = z.object({
    conversationId: z.string(),
    workflowId: z.string(),
    stepId: z.string(),
    action: z.enum(["execute", "skip", "manual_done"]),
    /** The original user request (needed for Blender agent steps) */
    userRequest: z.string().optional(),
    /** The workflow step data (sent from the UI to avoid re-fetching) */
    step: z.object({
        title: z.string(),
        description: z.string(),
        recommendedTool: z.enum(["blender_agent", "neural", "manual"]),
        category: z.string(),
        neuralProvider: z.string().optional(),
    }).optional(),
})

// ---------------------------------------------------------------------------
// Step executors
// ---------------------------------------------------------------------------

async function executeNeuralStep(
    step: NonNullable<z.infer<typeof RequestSchema>["step"]>,
    userRequest: string
): Promise<WorkflowStepResult> {
    const startTime = Date.now()

    try {
        // Dynamic import to avoid loading neural module when not needed
        const { createNeuralClient } = await import("@/lib/neural/registry")
        const providerSlug = (step.neuralProvider ?? "hunyuan-shape") as import("@/lib/neural/types").ProviderSlug

        const client = await createNeuralClient(providerSlug)
        const result = await client.generate({
            prompt: userRequest,
            provider: providerSlug,
            mode: "text_to_3d",
        })

        if (result.status === "completed" && result.modelPath) {
            // Import into Blender via MCP
            const mcpClient = createMcpClient()
            try {
                const importCode = `
import bpy

# Import the neural-generated mesh
bpy.ops.import_scene.gltf(filepath=r"${result.modelPath.replace(/\\/g, "\\\\")}")

# Center and normalize
imported = bpy.context.selected_objects
if imported:
    obj = imported[0]
    obj.name = "NeuralMesh_${step.category}"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    obj.location = (0, 0, 0)
    print(f"Imported neural mesh: {obj.name}")
`
                await mcpClient.execute({ type: "execute_code", params: { code: importCode } })
            } finally {
                await mcpClient.close()
            }

            return {
                stepId: "",
                status: "completed",
                message: `Neural mesh generated and imported into Blender (${result.provider})`,
                outputPath: result.modelPath,
                durationMs: Date.now() - startTime,
            }
        }

        return {
            stepId: "",
            status: "failed",
            error: result.error ?? "Neural generation returned no output",
            durationMs: Date.now() - startTime,
        }
    } catch (error) {
        return {
            stepId: "",
            status: "failed",
            error: error instanceof Error ? error.message : "Neural step execution failed",
            durationMs: Date.now() - startTime,
        }
    }
}

async function executeBlenderAgentStep(
    step: NonNullable<z.infer<typeof RequestSchema>["step"]>,
    userRequest: string
): Promise<WorkflowStepResult> {
    const startTime = Date.now()

    try {
        // Create a focused sub-request for this specific step
        const focusedRequest = `${step.description}. Context: the user is working on "${userRequest}". Focus only on this specific task: ${step.title}.`

        console.log(`[WorkflowStep] Executing blender agent step: "${step.title}"`)

        // Call the v2 LangGraph agent directly — it has:
        // - RAG middleware (injects relevant tool-guides from vectorstore)
        // - Updated system prompt with all direct MCP tools
        // - ReAct loop for autonomous tool selection
        const agent = createBlenderAgentV2({
            allowPolyHaven: true,
            allowSketchfab: false,
            allowHyper3d: false,
            useRAG: true,
        })

        const result = await agent.invoke(
            {
                messages: [{ role: "user" as const, content: focusedRequest }],
            },
            { configurable: { thread_id: `workflow-step-${Date.now()}` } }
        )

        // Check if the agent produced any tool calls / responses
        const messages = result.messages ?? []
        const hasToolCalls = messages.some(
            (m: Record<string, unknown>) =>
                (m as { _getType?: () => string })._getType?.() === "ai" &&
                Array.isArray((m as { tool_calls?: unknown[] }).tool_calls) &&
                ((m as { tool_calls?: unknown[] }).tool_calls?.length ?? 0) > 0
        )

        console.log(`[WorkflowStep] Agent completed: ${messages.length} messages, tool calls: ${hasToolCalls}`)

        return {
            stepId: "",
            status: hasToolCalls ? "completed" : "failed",
            message: hasToolCalls
                ? `Blender agent completed: ${step.title}`
                : undefined,
            error: hasToolCalls ? undefined : "Blender agent produced no tool calls",
            durationMs: Date.now() - startTime,
        }
    } catch (error) {
        console.error(`[WorkflowStep] Blender agent step failed:`, error)
        return {
            stepId: "",
            status: "failed",
            error: error instanceof Error ? error.message : "Blender agent step failed",
            durationMs: Date.now() - startTime,
        }
    }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request", details: parsed.error.format() },
            { status: 400 }
        )
    }

    const { stepId, action, step, userRequest } = parsed.data

    // ── Skip / Manual Done ──
    if (action === "skip") {
        const result: WorkflowStepResult = {
            stepId,
            status: "skipped",
            message: "Step skipped by user",
        }
        return NextResponse.json(result)
    }

    if (action === "manual_done") {
        const result: WorkflowStepResult = {
            stepId,
            status: "manual",
            message: "Step completed manually by user",
        }
        return NextResponse.json(result)
    }

    // ── Execute ──
    if (!step) {
        return NextResponse.json(
            { error: "Step data is required for execution" },
            { status: 400 }
        )
    }

    if (!userRequest) {
        return NextResponse.json(
            { error: "userRequest is required for execution" },
            { status: 400 }
        )
    }

    let result: WorkflowStepResult

    if (step.recommendedTool === "neural") {
        result = await executeNeuralStep(step, userRequest)
    } else if (step.recommendedTool === "blender_agent") {
        result = await executeBlenderAgentStep(step, userRequest)
    } else {
        result = {
            stepId,
            status: "manual",
            message: "This step is recommended for manual execution in Blender.",
        }
    }

    result.stepId = stepId

    return NextResponse.json(result)
}
