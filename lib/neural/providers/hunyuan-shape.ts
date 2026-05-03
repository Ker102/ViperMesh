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

import fs from "fs/promises"
import path from "path"
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
    getPrimaryImageFromMultiView,
    hasRequiredMultiViewRoles,
    normalizeMultiViewImages,
    type MultiViewImageInput,
} from "../multiview"

const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

function getAllowedRemoteImageHosts(): Set<string> {
    const hosts = new Set(
        (process.env.HUNYUAN_ALLOWED_IMAGE_HOSTS ?? "")
            .split(",")
            .map((host) => host.trim().toLowerCase())
            .filter(Boolean),
    )

    for (const value of [process.env.R2_PUBLIC_BASE_URL]) {
        if (!value) continue
        try {
            hosts.add(new URL(value).hostname.toLowerCase())
        } catch {
            // Ignore malformed optional host configuration.
        }
    }

    hosts.add("fal.media")
    hosts.add("storage.googleapis.com")
    return hosts
}

function isBlockedRemoteImageHost(hostname: string): boolean {
    const normalized = hostname.toLowerCase()
    return (
        normalized === "localhost" ||
        normalized.endsWith(".localhost") ||
        normalized.endsWith(".local") ||
        normalized === "127.0.0.1" ||
        normalized === "0.0.0.0" ||
        normalized === "::1" ||
        normalized.startsWith("10.") ||
        normalized.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
    )
}

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

    private async resolveImagePayload(imageUrl: string): Promise<string> {
        if (imageUrl.startsWith("data:")) {
            return imageUrl
        }
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            const url = new URL(imageUrl)
            const hostname = url.hostname.toLowerCase()
            const allowedHosts = getAllowedRemoteImageHosts()
            if (isBlockedRemoteImageHost(hostname) || !allowedHosts.has(hostname)) {
                throw new Error("Unsupported remote image host for Hunyuan Shape")
            }

            const imgRes = await fetch(url, {
                signal: AbortSignal.timeout(5_000),
            })
            if (!imgRes.ok) {
                throw new Error(`Failed to fetch reference image: ${imgRes.status}`)
            }

            const contentType = imgRes.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase()
            if (!contentType || !ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
                throw new Error("Remote reference URL did not return a supported image type")
            }

            const contentLength = Number(imgRes.headers.get("content-length") ?? 0)
            if (contentLength > MAX_REFERENCE_IMAGE_BYTES) {
                throw new Error("Remote reference image is larger than 10 MB")
            }

            const buf = Buffer.from(await imgRes.arrayBuffer())
            if (buf.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
                throw new Error("Remote reference image is larger than 10 MB")
            }

            return `data:${contentType};base64,${buf.toString("base64")}`
        }

        const ext = path.extname(imageUrl).toLowerCase()
        const contentType =
            ext === ".png"
                ? "image/png"
                : ext === ".jpg" || ext === ".jpeg"
                    ? "image/jpeg"
                    : ext === ".webp"
                        ? "image/webp"
                        : null
        if (!contentType) {
            throw new Error("Local reference image must be PNG, JPEG, or WebP")
        }

        const stat = await fs.stat(imageUrl)
        if (stat.size > MAX_REFERENCE_IMAGE_BYTES) {
            throw new Error("Local reference image is larger than 10 MB")
        }
        const buf = await fs.readFile(imageUrl)
        return `data:${contentType};base64,${buf.toString("base64")}`
    }

    private async resolveMultiViewPayload(images: MultiViewImageInput[]) {
        const entries = await Promise.all(
            images.map(async (image) => [image.role, await this.resolveImagePayload(image.imageUrl)] as const),
        )
        return Object.fromEntries(entries)
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

            const multiViewImages = normalizeMultiViewImages(request.multiViewImages)
            if (hasRequiredMultiViewRoles(multiViewImages, HUNYUAN_MULTI_VIEW_REQUIRED_ROLES)) {
                const multiViewPayload = await this.resolveMultiViewPayload(multiViewImages)
                payload.multi_view_images = multiViewPayload
                payload.view_images = multiViewPayload
                payload.images = HUNYUAN_MULTI_VIEW_REQUIRED_ROLES.map((role) => multiViewPayload[role])
                const primaryImage = getPrimaryImageFromMultiView(multiViewImages)
                if (primaryImage) {
                    payload.image = await this.resolveImagePayload(primaryImage)
                }
            } else if (request.imageUrl) {
                payload.image = await this.resolveImagePayload(request.imageUrl)
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
