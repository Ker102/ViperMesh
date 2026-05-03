/**
 * fal.ai Neural 3D Generation Client
 *
 * Unified client for all fal.ai hosted neural 3D models:
 *  - fal-ai/hunyuan3d-v21    (Hunyuan3D 2.1 — $0.05/gen geometry)
 *  - fal-ai/trellis-2        (TRELLIS 2 — $0.25-0.35/gen geometry + texture)
 *  - fal-ai/trellis-2/retexture (TRELLIS 2 retexture — mesh + reference image)
 *
 * Env vars:
 *  - FAL_KEY  (required — fal.ai API key)
 *
 * All models return GLB files via fal.ai's serverless infrastructure.
 * Zero cold start, scale-to-zero built-in, pay-per-call.
 */

import { fal } from "@fal-ai/client"
import { Neural3DClient } from "../base-client"
import type {
    GenerationRequest,
    GenerationResult,
    Neural3DProviderMeta,
    ProviderSlug,
} from "../types"
import { PROVIDERS } from "../registry"
import {
    HUNYUAN_MULTI_VIEW_REQUIRED_ROLES,
    hasRequiredMultiViewRoles,
    normalizeMultiViewImages,
} from "../multiview"

// ---------------------------------------------------------------------------
// fal.ai model endpoint mapping
// ---------------------------------------------------------------------------

const FAL_ENDPOINTS: Record<string, string> = {
    "hunyuan-shape": "fal-ai/hunyuan3d-v21",
    "hunyuan-shape-multiview": "fal-ai/hunyuan3d/v2/multi-view",
    trellis: "fal-ai/trellis-2",
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class FalClient extends Neural3DClient {
    readonly name: string
    readonly slug: ProviderSlug
    readonly meta: Neural3DProviderMeta

    private readonly falEndpoint: string

    constructor(providerSlug: ProviderSlug = "hunyuan-shape") {
        super()
        this.slug = providerSlug
        this.name = `fal.ai ${PROVIDERS[providerSlug]?.name ?? providerSlug}`
        this.meta = PROVIDERS[providerSlug] ?? PROVIDERS["hunyuan-shape"]
        this.falEndpoint = FAL_ENDPOINTS[providerSlug] ?? FAL_ENDPOINTS["hunyuan-shape"]

        // Configure fal.ai credentials
        const falKey = process.env.FAL_KEY
        if (falKey) {
            fal.config({ credentials: falKey })
        }
    }

    // -------------------------------------------------------------------------
    // Health check — verify fal.ai is reachable and we have a key
    // -------------------------------------------------------------------------

    async healthCheck(): Promise<boolean> {
        if (!process.env.FAL_KEY) {
            console.warn("[fal.ai] FAL_KEY not set — cannot use fal.ai provider")
            return false
        }

        try {
            // fal.ai doesn't have an explicit health endpoint, but we can
            // check if the API key is valid by trying a minimal status call
            // We'll just verify the key exists — the actual failure will
            // surface during generation if the key is invalid
            return true
        } catch {
            return false
        }
    }

    // -------------------------------------------------------------------------
    // Generate — call fal.ai's queue-based API
    // -------------------------------------------------------------------------

    async generate(request: GenerationRequest): Promise<GenerationResult> {
        const startTime = Date.now()

        try {
            if (!process.env.FAL_KEY) {
                return {
                    status: "failed",
                    provider: this.slug,
                    stage: "geometry",
                    error: "FAL_KEY environment variable is not set",
                    generationTimeMs: Date.now() - startTime,
                }
            }

            // Build input payload based on provider
            const input: Record<string, unknown> = {}
            let endpoint = this.falEndpoint

            if (this.slug === "hunyuan-shape") {
                const multiViewImages = normalizeMultiViewImages(request.multiViewImages)
                const hasMultiView = hasRequiredMultiViewRoles(multiViewImages, HUNYUAN_MULTI_VIEW_REQUIRED_ROLES)
                // Hunyuan3D 2.1 on fal.ai: input field is "input_image_url" (not "image_url")
                if (hasMultiView) {
                    const byRole = new Map(multiViewImages.map((image) => [image.role, image.imageUrl]))
                    input.front_image_url = byRole.get("front")
                    input.back_image_url = byRole.get("back")
                    input.left_image_url = byRole.get("left")
                    endpoint = FAL_ENDPOINTS["hunyuan-shape-multiview"]
                } else if (request.imageUrl) {
                    input.input_image_url = request.imageUrl
                } else {
                    return {
                        status: "failed",
                        provider: this.slug,
                        stage: "geometry",
                        error: "fal.ai Hunyuan3D requires an image URL (input_image_url). For text-to-3D, generate a reference image first.",
                        generationTimeMs: Date.now() - startTime,
                    }
                }
                // Enable PBR textured mesh output (costs 3x but we need it)
                input.textured_mesh = true
                input.octree_resolution = request.resolution ?? 256
            } else if (this.slug === "trellis") {
                // TRELLIS 2 on fal.ai: input field is "image_url"
                if (request.imageUrl) {
                    input.image_url = request.imageUrl
                } else {
                    return {
                        status: "failed",
                        provider: this.slug,
                        stage: "geometry",
                        error: "fal.ai TRELLIS 2 requires an image URL (image_url).",
                        generationTimeMs: Date.now() - startTime,
                    }
                }
                // TRELLIS 2 specific defaults
                input.resolution = request.resolution ?? 1024
                input.remesh = true
                input.texture_size = 2048
                input.decimation_target = 500000
            }

            // Call fal.ai with queue-based subscription
            console.log(`[fal.ai] Submitting ${endpoint} request...`)

            const result = await fal.subscribe(endpoint, {
                input,
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === "IN_PROGRESS") {
                        const logs = (update as { logs?: Array<{ message: string }> }).logs
                        if (logs) {
                            logs.map((log) => log.message).forEach((msg) =>
                                console.log(`[fal.ai] ${msg}`)
                            )
                        }
                    }
                },
            })

            // Extract GLB URL from result
            // Hunyuan: model_glb_pbr (PBR) or model_glb (white mesh)
            // Hunyuan multi-view: model_mesh
            // TRELLIS: model_glb
            const data = result.data as Record<string, unknown>
            const modelGlbPbr = data.model_glb_pbr as { url?: string } | undefined
            const modelGlb = data.model_glb as { url?: string } | undefined
            const modelMesh = data.model_mesh as { url?: string } | undefined
            const glbUrl = modelGlbPbr?.url ?? modelGlb?.url ?? modelMesh?.url

            console.log(`[fal.ai] Response keys: ${Object.keys(data).join(", ")}`)
            if (modelGlbPbr?.url) console.log(`[fal.ai] PBR model available`)

            if (!glbUrl) {
                console.error(`[fal.ai] Full response data:`, JSON.stringify(data, null, 2))
                return {
                    status: "failed",
                    provider: this.slug,
                    stage: "geometry",
                    error: `fal.ai returned no model URL. Response keys: ${Object.keys(data).join(", ")}`,
                    generationTimeMs: Date.now() - startTime,
                }
            }

            // Download the GLB file to local storage
            const modelPath = await this.downloadModel(
                glbUrl,
                `fal-${this.slug}-${Date.now()}.glb`,
            )

            console.log(`[fal.ai] Model saved to ${modelPath} (${this.slug})`)

            return {
                status: "completed",
                modelPath,
                provider: this.slug,
                stage: this.slug === "trellis" ? "texturing" : "geometry",
                generationTimeMs: Date.now() - startTime,
            }
        } catch (err) {
            return {
                status: "failed",
                provider: this.slug,
                stage: "geometry",
                error: `fal.ai ${this.slug} generation failed: ${err instanceof Error ? err.message : String(err)}`,
                generationTimeMs: Date.now() - startTime,
            }
        }
    }
}
