/**
 * Hunyuan3D Shape 2.1 — Geometry Generation Client
 *
 * Connects to the self-hosted `api_server.py` from the official
 * Hunyuan3D-2.1 repository (https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1).
 *
 * Capabilities:
 *  - image_to_3d: Reference image → untextured mesh
 *  - text_to_3d:  Text prompt → untextured mesh (via built-in caption model)
 *
 * Env vars:
 *  - HUNYUAN_SHAPE_API_URL  (preferred dedicated shape endpoint)
 *  - HUNYUAN_SHAPE_API_TOKEN (optional bearer token for dedicated shape endpoint)
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

export class HunyuanShapeClient extends Neural3DClient {
    readonly name = "Hunyuan3D Shape 2.1"
    readonly slug: ProviderSlug = "hunyuan-shape"
    readonly meta: Neural3DProviderMeta = PROVIDERS["hunyuan-shape"]

    private readonly baseUrl: string
    private readonly apiToken?: string

    constructor() {
        super()
        this.baseUrl =
            process.env.HUNYUAN_SHAPE_API_URL ??
            process.env.HUNYUAN_API_URL ??
            "http://localhost:8080"
        this.apiToken = process.env.HUNYUAN_SHAPE_API_TOKEN?.trim() || undefined
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

    // -------------------------------------------------------------------------
    // Health check — hit the API server's root or /health endpoint
    // -------------------------------------------------------------------------

    async healthCheck(): Promise<boolean> {
        try {
            const res = await fetch(`${this.baseUrl}/health`, {
                method: "GET",
                headers: this.buildHeaders(),
                signal: AbortSignal.timeout(5_000),
            })
            return res.ok
        } catch {
            // If /health doesn't exist, try a simple TCP probe to root
            try {
                const res = await fetch(this.baseUrl, {
                    method: "GET",
                    headers: this.buildHeaders(),
                    signal: AbortSignal.timeout(5_000),
                })
                return res.ok
            } catch {
                return false
            }
        }
    }

    // -------------------------------------------------------------------------
    // Generate — call the Hunyuan3D api_server.py /generate endpoint
    // -------------------------------------------------------------------------

    async generate(request: GenerationRequest): Promise<GenerationResult> {
        const startTime = Date.now()

        try {
            // Build the request payload for Hunyuan3D api_server
            const payload: Record<string, unknown> = {
                output_format: request.outputFormat ?? "glb",
            }

            if (request.imageUrl) {
                // If it's already base64, use directly; otherwise read from path
                if (request.imageUrl.startsWith("data:")) {
                    payload.image = request.imageUrl
                } else if (request.imageUrl.startsWith("http")) {
                    // Download and convert to base64
                    const imgRes = await fetch(request.imageUrl)
                    const buf = Buffer.from(await imgRes.arrayBuffer())
                    payload.image = `data:image/png;base64,${buf.toString("base64")}`
                } else {
                    // Local file path
                    payload.image = await this.imageToBase64(request.imageUrl)
                }
            }

            if (request.prompt) {
                payload.text = request.prompt
            }

            const response = await fetch(`${this.baseUrl}/generate`, {
                method: "POST",
                headers: this.buildHeaders("application/json"),
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errText = await response.text()
                return {
                    status: "failed",
                    provider: this.slug,
                    stage: "geometry",
                    error: `Hunyuan Shape API error ${response.status}: ${errText}`,
                    generationTimeMs: Date.now() - startTime,
                }
            }

            // The api_server returns the GLB binary directly in the response body
            const modelBuffer = Buffer.from(await response.arrayBuffer())
            const modelPath = await this.saveModelFromBuffer(
                modelBuffer,
                `hunyuan-shape-${Date.now()}.glb`,
            )

            return {
                status: "completed",
                modelPath,
                provider: this.slug,
                stage: "geometry",
                generationTimeMs: Date.now() - startTime,
            }
        } catch (err) {
            return {
                status: "failed",
                provider: this.slug,
                stage: "geometry",
                error: `Hunyuan Shape generation failed: ${err instanceof Error ? err.message : String(err)}`,
                generationTimeMs: Date.now() - startTime,
            }
        }
    }
}
