/**
 * Hunyuan3D Part — Mesh Segmentation Client
 *
 * Splits a 3D mesh into semantic sub-parts (gears, connectors, housings, etc.).
 * Useful for mechanical objects, kitbashing, or preparing models for rigging.
 *
 * Env vars:
 *  - HUNYUAN_PART_URL  (required, e.g. http://localhost:7861)
 */

import { Neural3DClient } from "../base-client"
import type {
    GenerationRequest,
    GenerationResult,
    Neural3DProviderMeta,
    ProviderSlug,
} from "../types"
import { PROVIDERS } from "../registry"
import fs from "fs/promises"

export class HunyuanPartClient extends Neural3DClient {
    readonly name = "Hunyuan3D Part"
    readonly slug: ProviderSlug = "hunyuan-part"
    readonly meta: Neural3DProviderMeta = PROVIDERS["hunyuan-part"]

    private readonly baseUrl: string

    constructor() {
        super()
        this.baseUrl = (process.env.HUNYUAN_PART_URL ?? "").trim()
    }

    async healthCheck(): Promise<boolean> {
        if (!this.baseUrl) return false
        try {
            const res = await fetch(this.baseUrl, {
                method: "GET",
                signal: AbortSignal.timeout(10_000),
            })
            return res.ok
        } catch {
            return false
        }
    }

    async generate(request: GenerationRequest): Promise<GenerationResult> {
        const startTime = Date.now()

        try {
            if (!this.baseUrl) {
                return {
                    status: "failed",
                    provider: this.slug,
                    stage: "segmentation",
                    error: "HUNYUAN_PART_URL is not configured.",
                }
            }

            if (!request.meshUrl) {
                return {
                    status: "failed",
                    provider: this.slug,
                    stage: "segmentation",
                    error: "Hunyuan Part requires a meshUrl to segment.",
                }
            }

            // Use the @gradio/client to interact with the Gradio app
            // Dynamic import so we don't force the dependency on all users
            const { Client } = await import("@gradio/client")
            const client = await Client.connect(this.baseUrl)

            // Read the input mesh file
            let meshBlob: Blob
            if (request.meshUrl.startsWith("http")) {
                const meshRes = await fetch(request.meshUrl)
                meshBlob = await meshRes.blob()
            } else {
                const buf = await fs.readFile(request.meshUrl)
                meshBlob = new Blob([new Uint8Array(buf)])
            }

            // Submit to the Gradio predict endpoint
            const result = await client.predict("/predict", {
                input_model: meshBlob,
            })

            // The result contains segmented model file(s)
            const data = result.data as Array<{ url?: string; path?: string }>
            if (data.length > 0 && (data[0].url || data[0].path)) {
                const outputUrl = data[0].url ?? data[0].path!
                const modelPath = await this.downloadModel(
                    outputUrl,
                    `hunyuan-part-${Date.now()}.glb`,
                )

                return {
                    status: "completed",
                    modelPath,
                    provider: this.slug,
                    stage: "segmentation",
                    generationTimeMs: Date.now() - startTime,
                }
            }

            return {
                status: "failed",
                provider: this.slug,
                stage: "segmentation",
                error: "Hunyuan Part returned no output data.",
                generationTimeMs: Date.now() - startTime,
            }
        } catch (err) {
            return {
                status: "failed",
                provider: this.slug,
                stage: "segmentation",
                error: `Hunyuan Part segmentation failed: ${err instanceof Error ? err.message : String(err)}`,
                generationTimeMs: Date.now() - startTime,
            }
        }
    }
}
