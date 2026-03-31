/**
 * RunPod Serverless Provider Client
 *
 * Runs self-hosted neural models on RunPod Serverless GPUs.
 * Supports Hunyuan Paint (PBR texturing) and Hunyuan Part (segmentation)
 * via custom Docker containers deployed as RunPod endpoints.
 *
 * Architecture:
 *  - Each model runs as a separate RunPod Serverless endpoint
 *  - Endpoints scale to zero (flex workers), pay per second
 *  - Sub-200ms cold starts with FlashBoot enabled
 *
 * Env vars:
 *  - RUNPOD_API_KEY (required): API key for RunPod
 *  - RUNPOD_ENDPOINT_HUNYUAN_PAINT: Endpoint ID for Hunyuan Paint
 *  - RUNPOD_ENDPOINT_HUNYUAN_PART: Endpoint ID for Hunyuan Part
 *
 * API: https://docs.runpod.io/serverless/endpoints/send-requests
 */

import { Neural3DClient } from "../base-client"
import type {
    GenerationRequest,
    GenerationResult,
    Neural3DProviderMeta,
    ProviderSlug,
} from "../types"

// ---------------------------------------------------------------------------
// RunPod API types
// ---------------------------------------------------------------------------

interface RunPodJobResponse {
    id: string
    status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMED_OUT"
}

interface RunPodStatusResponse extends RunPodJobResponse {
    delayTime?: number
    executionTime?: number
    output?: {
        /** URL to the generated 3D model file */
        model_url?: string
        /** URL to a generated texture file */
        texture_url?: string
        /** Any model-specific output data */
        [key: string]: unknown
    }
    error?: string
}

interface RunPodHealthResponse {
    jobs: {
        completed: number
        failed: number
        inProgress: number
        inQueue: number
        retried: number
    }
    workers: {
        idle: number
        running: number
    }
}

// ---------------------------------------------------------------------------
// Endpoint ID map — each model gets its own serverless endpoint
// ---------------------------------------------------------------------------

const ENDPOINT_MAP: Record<string, string | undefined> = {
    "hunyuan-paint": process.env.RUNPOD_ENDPOINT_HUNYUAN_PAINT,
    "hunyuan-part": process.env.RUNPOD_ENDPOINT_HUNYUAN_PART,
}

const RUNPOD_API_BASE = "https://api.runpod.ai/v2"

// ---------------------------------------------------------------------------
// Provider metadata
// ---------------------------------------------------------------------------

const PROVIDER_META: Record<string, Neural3DProviderMeta> = {
    "hunyuan-paint": {
        slug: "hunyuan-paint",
        name: "Hunyuan Paint (RunPod)",
        stages: ["texturing"],
        modes: ["mesh_to_texture"],
        selfHosted: true,
        outputFormats: ["glb", "obj"],
        estimatedTime: { min: 30, max: 180 },
        vramGb: 21,
    },
    "hunyuan-part": {
        slug: "hunyuan-part",
        name: "Hunyuan Part (RunPod)",
        stages: ["segmentation"],
        modes: ["mesh_to_parts"],
        selfHosted: true,
        outputFormats: ["glb"],
        estimatedTime: { min: 15, max: 60 },
        vramGb: 10,
    },
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class RunPodClient extends Neural3DClient {
    readonly name: string
    readonly slug: ProviderSlug
    readonly meta: Neural3DProviderMeta

    private readonly apiKey: string
    private readonly endpointId: string

    constructor(slug: ProviderSlug) {
        super()

        const apiKey = process.env.RUNPOD_API_KEY
        if (!apiKey) {
            throw new Error("RUNPOD_API_KEY environment variable is not set")
        }

        const endpointId = ENDPOINT_MAP[slug]
        if (!endpointId) {
            throw new Error(
                `No RunPod endpoint configured for provider "${slug}". ` +
                `Set RUNPOD_ENDPOINT_${slug.toUpperCase().replace("-", "_")} in your .env`
            )
        }

        const meta = PROVIDER_META[slug]
        if (!meta) {
            throw new Error(`RunPod client does not support provider "${slug}"`)
        }

        this.slug = slug
        this.name = meta.name
        this.meta = meta
        this.apiKey = apiKey
        this.endpointId = endpointId
    }

    // -------------------------------------------------------------------------
    // Health Check
    // -------------------------------------------------------------------------

    async healthCheck(): Promise<boolean> {
        try {
            const res = await fetch(`${RUNPOD_API_BASE}/${this.endpointId}/health`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            })

            if (!res.ok) return false

            const data = (await res.json()) as RunPodHealthResponse
            console.log(`[RunPod] ${this.name} health:`, {
                workers: data.workers,
                jobs: { queued: data.jobs.inQueue, active: data.jobs.inProgress },
            })

            return true
        } catch (err) {
            console.error(`[RunPod] ${this.name} health check failed:`, err)
            return false
        }
    }

    // -------------------------------------------------------------------------
    // Generate
    // -------------------------------------------------------------------------

    async generate(request: GenerationRequest): Promise<GenerationResult> {
        const startTime = Date.now()

        try {
            // 1. Build input payload based on provider
            const input = this.buildInput(request)

            // 2. Submit async job via /run
            console.log(`[RunPod] Submitting ${this.slug} job...`)
            const submitRes = await fetch(`${RUNPOD_API_BASE}/${this.endpointId}/run`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({ input }),
            })

            if (!submitRes.ok) {
                const errText = await submitRes.text()
                throw new Error(`RunPod submit failed (${submitRes.status}): ${errText}`)
            }

            const job = (await submitRes.json()) as RunPodJobResponse
            console.log(`[RunPod] Job submitted: ${job.id} (status: ${job.status})`)

            // 3. Poll /status until COMPLETED or FAILED
            const result = await this.pollJobUntilDone(job.id, 5_000, 300_000)

            // Add timing
            if (result.status === "completed") {
                result.generationTimeMs = Date.now() - startTime
            }

            return result
        } catch (err) {
            return {
                status: "failed",
                provider: this.slug,
                stage: this.meta.stages[0],
                error: err instanceof Error ? err.message : String(err),
                generationTimeMs: Date.now() - startTime,
            }
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Build the input payload for RunPod based on the provider type.
     * The worker container's handler must understand this format.
     */
    private buildInput(request: GenerationRequest): Record<string, unknown> {
        if (this.slug === "hunyuan-paint") {
            return {
                mesh_url: request.meshUrl,
                prompt: request.prompt ?? "high quality PBR texture",
                texture_resolution: request.textureResolution ?? "2K",
                output_format: request.outputFormat ?? "glb",
            }
        }

        if (this.slug === "hunyuan-part") {
            return {
                mesh_url: request.meshUrl,
                output_format: request.outputFormat ?? "glb",
            }
        }

        // Generic fallback
        return {
            prompt: request.prompt,
            image_url: request.imageUrl,
            mesh_url: request.meshUrl,
            output_format: request.outputFormat ?? "glb",
        }
    }

    /**
     * Poll a job's status and download the model when complete.
     */
    private async checkJobStatus(jobId: string): Promise<GenerationResult> {
        const res = await fetch(
            `${RUNPOD_API_BASE}/${this.endpointId}/status/${jobId}`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } },
        )

        if (!res.ok) {
            throw new Error(`RunPod status check failed (${res.status})`)
        }

        const data = (await res.json()) as RunPodStatusResponse

        // Map RunPod statuses to our pipeline statuses
        switch (data.status) {
            case "COMPLETED": {
                const modelUrl = data.output?.model_url
                if (!modelUrl) {
                    return {
                        status: "failed",
                        provider: this.slug,
                        stage: this.meta.stages[0],
                        error: "Job completed but no model_url in output",
                    }
                }

                console.log(`[RunPod] Job ${jobId} completed in ${data.executionTime}ms, downloading...`)
                const modelPath = await this.downloadModel(modelUrl)

                return {
                    status: "completed",
                    provider: this.slug,
                    stage: this.meta.stages[0],
                    modelPath,
                }
            }

            case "FAILED":
            case "TIMED_OUT":
            case "CANCELLED":
                return {
                    status: "failed",
                    provider: this.slug,
                    stage: this.meta.stages[0],
                    error: data.error ?? `Job ${data.status.toLowerCase()}`,
                }

            case "IN_QUEUE":
                console.log(`[RunPod] Job ${jobId}: waiting in queue...`)
                return { status: "pending", provider: this.slug, stage: this.meta.stages[0] }

            case "IN_PROGRESS":
                console.log(`[RunPod] Job ${jobId}: processing...`)
                return { status: "processing", provider: this.slug, stage: this.meta.stages[0] }

            default:
                return { status: "pending", provider: this.slug, stage: this.meta.stages[0] }
        }
    }

    private async pollJobUntilDone(
        jobId: string,
        intervalMs: number,
        maxWaitMs: number,
    ): Promise<GenerationResult> {
        const deadline = Date.now() + maxWaitMs
        let lastObservedStatus: GenerationResult["status"] = "pending"

        while (Date.now() < deadline) {
            const result = await this.checkJobStatus(jobId)
            lastObservedStatus = result.status

            if (result.status === "completed" || result.status === "failed") {
                return result
            }

            await new Promise((resolve) => setTimeout(resolve, intervalMs))
        }

        const error =
            lastObservedStatus === "pending"
                ? "RunPod did not start this generation within 5 minutes. The endpoint appears to have stayed in queue or failed to warm up in time. Please retry."
                : "RunPod started processing this generation but did not finish within 5 minutes. Please retry, or check the endpoint health if this keeps happening."

        return {
            status: "failed",
            provider: this.slug,
            stage: this.meta.stages[0],
            error,
        }
    }
}
