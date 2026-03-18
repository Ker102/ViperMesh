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
import { createMcpClient } from "@/lib/mcp"
import { BlenderPlanner } from "@/lib/orchestration/planner"
import { PlanExecutor } from "@/lib/orchestration/executor"
import type { WorkflowStepAction, WorkflowStepResult, WorkflowStep } from "@/lib/orchestration/workflow-types"
import type { LlmProviderSpec } from "@/lib/llm"
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
    userRequest: string,
    llmProvider?: LlmProviderSpec
): Promise<WorkflowStepResult> {
    const startTime = Date.now()

    try {
        // Create a focused sub-request for this specific step
        const focusedRequest = `${step.description}. Context: the user is working on "${userRequest}". Focus only on this specific task: ${step.title}.`

        const mcpClient = createMcpClient()

        try {
            const planner = new BlenderPlanner()
            const planResult = await planner.generatePlan(
                focusedRequest,
                {
                    allowHyper3dAssets: false,
                    allowSketchfabAssets: false,
                    allowPolyHavenAssets: true,
                },
                llmProvider
            )

            if (!planResult?.plan) {
                return {
                    stepId: "",
                    status: "failed",
                    error: "Failed to generate a plan for this step",
                    durationMs: Date.now() - startTime,
                }
            }

            const executor = new PlanExecutor()
            const executionResult = await executor.executePlan(
                planResult.plan,
                focusedRequest,
                {
                    allowHyper3d: false,
                    allowSketchfab: false,
                    allowPolyHaven: true,
                    enableVisualFeedback: true,
                },
                planResult.analysis,
                llmProvider
            )

            return {
                stepId: "",
                status: executionResult.success ? "completed" : "failed",
                message: executionResult.success
                    ? `Blender agent completed: ${step.title}`
                    : undefined,
                error: executionResult.success ? undefined : "Blender agent execution failed",
                durationMs: Date.now() - startTime,
            }
        } finally {
            await mcpClient.close()
        }
    } catch (error) {
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
