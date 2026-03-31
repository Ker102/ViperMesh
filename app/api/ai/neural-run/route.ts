import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { createNeuralClient } from "@/lib/neural/registry"
import type { GenerationMode, ProviderSlug } from "@/lib/neural/types"
import { buildNeuralOutputUrl } from "@/lib/neural/output-files"

const ProviderSchema = z.enum(["hunyuan-shape", "trellis"])

const RequestSchema = z.object({
    provider: ProviderSchema,
    prompt: z.string().trim().max(1000).optional(),
    imageDataUrl: z.string().trim().optional(),
    resolution: z.number().int().positive().optional(),
})

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let payload: unknown
    try {
        payload = await request.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const parsed = RequestSchema.safeParse(payload)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request", details: parsed.error.flatten() },
            { status: 400 },
        )
    }

    const { provider, prompt, imageDataUrl, resolution } = parsed.data
    if (!prompt && !imageDataUrl) {
        return NextResponse.json(
            { error: "A prompt or reference image is required" },
            { status: 400 },
        )
    }

    if (provider === "trellis" && !imageDataUrl) {
        return NextResponse.json(
            { error: "TRELLIS requires a reference image" },
            { status: 400 },
        )
    }

    const mode: GenerationMode =
        provider === "trellis"
            ? "image_to_3d"
            : imageDataUrl
                ? "image_to_3d"
                : "text_to_3d"

    try {
        const client = await createNeuralClient(provider as ProviderSlug)
        const result = await client.generate({
            provider: provider as ProviderSlug,
            mode,
            prompt,
            imageUrl: imageDataUrl,
            resolution,
            outputFormat: "glb",
        })

        if (result.status !== "completed" || !result.modelPath) {
            return NextResponse.json(
                {
                    ...result,
                    viewerUrl: null,
                },
                { status: 422 },
            )
        }

        return NextResponse.json({
            ...result,
            viewerUrl: buildNeuralOutputUrl(result.modelPath),
        })
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Neural generation failed",
            },
            { status: 500 },
        )
    }
}
