/**
 * Hunyuan3D Paint 2.1 — PBR Texture Generation Client
 *
 * Takes an untextured mesh + reference image and generates production-ready
 * PBR textures (albedo, roughness, metallic, normal).
 *
 * Env vars:
 *  - HUNYUAN_PAINT_API_URL  (preferred dedicated paint endpoint)
 *  - HUNYUAN_PAINT_API_TOKEN (optional bearer token for dedicated paint endpoint)
 *  - HUNYUAN_API_URL        (legacy shared shape/paint endpoint fallback)
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

export class HunyuanPaintClient extends Neural3DClient {
    readonly name = "Hunyuan3D Paint 2.1"
    readonly slug: ProviderSlug = "hunyuan-paint"
    readonly meta: Neural3DProviderMeta = PROVIDERS["hunyuan-paint"]

    private readonly baseUrl: string
    private readonly apiToken?: string

    constructor() {
        super()
        this.baseUrl =
            process.env.HUNYUAN_PAINT_API_URL ??
            process.env.HUNYUAN_API_URL ??
            "http://localhost:8080"
        this.apiToken = process.env.HUNYUAN_PAINT_API_TOKEN?.trim() || undefined
    }

    private buildHeaders(contentType?: string): HeadersInit {
        const headers: Record<string, string> = {}
        if (contentType) {
            headers["Content-Type"] = contentType
        }
        if (this.apiToken) {
            headers.Authorization = `Bearer ${this.apiToken}`
        }
        return headers
    }

    async healthCheck(): Promise<boolean> {
        try {
            const res = await fetch(`${this.baseUrl}/health`, {
                method: "GET",
                headers: this.buildHeaders(),
                signal: AbortSignal.timeout(5_000),
            })
            return res.ok
        } catch {
            return false
        }
    }

    async generate(request: GenerationRequest): Promise<GenerationResult> {
        const startTime = Date.now()

        try {
            if (!request.meshUrl) {
                return {
                    status: "failed",
                    provider: this.slug,
                    stage: "texturing",
                    error: "Hunyuan Paint requires a meshUrl (path to untextured mesh).",
                }
            }

            // Read the mesh file
            let meshBase64: string
            if (request.meshUrl.startsWith("http")) {
                const meshRes = await fetch(request.meshUrl)
                const buf = Buffer.from(await meshRes.arrayBuffer())
                meshBase64 = buf.toString("base64")
            } else {
                const buf = await fs.readFile(request.meshUrl)
                meshBase64 = buf.toString("base64")
            }

            // Reference image for texture guidance
            let imageBase64: string | undefined
            if (request.imageUrl) {
                if (request.imageUrl.startsWith("data:")) {
                    imageBase64 = request.imageUrl
                } else if (request.imageUrl.startsWith("http")) {
                    const imgRes = await fetch(request.imageUrl)
                    const buf = Buffer.from(await imgRes.arrayBuffer())
                    imageBase64 = `data:image/png;base64,${buf.toString("base64")}`
                } else {
                    imageBase64 = await this.imageToBase64(request.imageUrl)
                }
            }

            const payload: Record<string, unknown> = {
                mesh: meshBase64,
                image: imageBase64,
                output_format: request.outputFormat ?? "glb",
            }

            const response = await fetch(`${this.baseUrl}/texturize`, {
                method: "POST",
                headers: this.buildHeaders("application/json"),
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errText = await response.text()
                return {
                    status: "failed",
                    provider: this.slug,
                    stage: "texturing",
                    error: `Hunyuan Paint API error ${response.status}: ${errText}`,
                    generationTimeMs: Date.now() - startTime,
                }
            }

            const modelBuffer = Buffer.from(await response.arrayBuffer())
            const modelPath = await this.saveModelFromBuffer(
                modelBuffer,
                `hunyuan-paint-${Date.now()}.glb`,
            )

            return {
                status: "completed",
                modelPath,
                provider: this.slug,
                stage: "texturing",
                generationTimeMs: Date.now() - startTime,
            }
        } catch (err) {
            return {
                status: "failed",
                provider: this.slug,
                stage: "texturing",
                error: `Hunyuan Paint generation failed: ${err instanceof Error ? err.message : String(err)}`,
                generationTimeMs: Date.now() - startTime,
            }
        }
    }
}
