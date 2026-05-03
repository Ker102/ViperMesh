import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { createNeuralClient } from "@/lib/neural/registry"
import type { GenerationMode, GenerationResult, ProviderSlug } from "@/lib/neural/types"
import { buildNeuralOutputUrl, resolveNeuralOutputPath } from "@/lib/neural/output-files"
import {
    HUNYUAN_MULTI_VIEW_REQUIRED_ROLES,
    getPrimaryImageFromMultiView,
    hasRequiredMultiViewRoles,
    isMultiViewRole,
    normalizeMultiViewImages,
    type MultiViewImageInput,
} from "@/lib/neural/multiview"

const ProviderSchema = z.enum([
    "hunyuan-shape",
    "trellis",
    "hunyuan-paint",
    "yvo3d",
    "hunyuan-part",
    "unirig",
    "meshanything-v2",
])

const RequestSchema = z.object({
    provider: ProviderSchema,
    prompt: z.string().trim().max(1000).optional(),
    imageDataUrl: z.string().trim().optional(),
    multiViewImages: z.array(z.object({
        role: z.string().trim(),
        imageDataUrl: z.string().trim(),
    })).max(4).optional(),
    meshUrl: z.string().trim().optional(),
    resolution: z.number().int().min(1).optional(),
    textureResolution: z.string().trim().optional(),
    targetFaces: z.number().int().min(100).max(1600).optional(),
})

function normalizeRequestMultiViewImages(
    images?: z.infer<typeof RequestSchema>["multiViewImages"],
): MultiViewImageInput[] {
    return normalizeMultiViewImages(
        images
            ?.filter((image) => isMultiViewRole(image.role))
            .map((image) => ({
                role: image.role,
                imageUrl: image.imageDataUrl,
            })),
    )
}

function validateRequest(
    provider: z.infer<typeof ProviderSchema>,
    payload: z.infer<typeof RequestSchema>,
    multiViewImages: MultiViewImageInput[],
): string | null {
    if (multiViewImages.length > 0 && provider !== "hunyuan-shape") {
        return "Multi-view reference images are only supported by Hunyuan3D Shape right now"
    }

    switch (provider) {
        case "trellis":
            return payload.imageDataUrl ? null : "TRELLIS requires a reference image"
        case "hunyuan-shape":
            return payload.prompt ||
                payload.imageDataUrl ||
                hasRequiredMultiViewRoles(multiViewImages, HUNYUAN_MULTI_VIEW_REQUIRED_ROLES)
                ? null
                : "A prompt, reference image, or complete multi-view set is required"
        case "hunyuan-paint":
        case "hunyuan-part":
        case "unirig":
        case "meshanything-v2":
            return payload.meshUrl ? null : "A source mesh is required"
        case "yvo3d":
            return payload.meshUrl || payload.imageDataUrl
                ? null
                : "A source mesh or reference image is required"
        default:
            return "Unsupported neural provider"
    }
}

function resolveMode(
    provider: z.infer<typeof ProviderSchema>,
    payload: z.infer<typeof RequestSchema>,
    multiViewImages: MultiViewImageInput[],
): GenerationMode {
    switch (provider) {
        case "trellis":
            return "image_to_3d"
        case "hunyuan-shape":
            return payload.imageDataUrl || multiViewImages.length > 0 ? "image_to_3d" : "text_to_3d"
        case "hunyuan-paint":
        case "yvo3d":
            return payload.meshUrl ? "mesh_to_texture" : "image_to_3d"
        case "hunyuan-part":
            return "mesh_to_parts"
        case "unirig":
            return "mesh_to_rig"
        case "meshanything-v2":
            return "mesh_to_retopo"
    }
}

function resolveViewerUrl(result: GenerationResult): string | null {
    const outputPath = result.modelPath ?? result.riggedModelPath ?? result.retopologyPath
    if (!outputPath || !outputPath.toLowerCase().endsWith(".glb")) {
        return null
    }
    return buildNeuralOutputUrl(outputPath)
}

function resolveMeshInput(meshUrl?: string): string | undefined {
    if (!meshUrl) return undefined

    try {
        const parsed = new URL(meshUrl, "http://127.0.0.1")
        if (parsed.pathname === "/api/ai/neural-output") {
            const rawPath = parsed.searchParams.get("path")
            if (!rawPath) return undefined
            const safePath = resolveNeuralOutputPath(rawPath)
            return safePath ?? undefined
        }
    } catch {
        // Fall through to raw value handling
    }

    return meshUrl
}

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

    const { provider, prompt, imageDataUrl, meshUrl, resolution, textureResolution, targetFaces } = parsed.data
    const multiViewImages = normalizeRequestMultiViewImages(parsed.data.multiViewImages)
    const primaryMultiViewImage = getPrimaryImageFromMultiView(multiViewImages)
    const resolvedMeshUrl = resolveMeshInput(meshUrl)
    const normalizedPayload = {
        ...parsed.data,
        imageDataUrl: imageDataUrl ?? primaryMultiViewImage,
        meshUrl: resolvedMeshUrl,
    }

    const validationError = validateRequest(provider, normalizedPayload, multiViewImages)
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const mode = resolveMode(provider, normalizedPayload, multiViewImages)

    try {
        const client = await createNeuralClient(provider as ProviderSlug)
        const result = await client.generate({
            provider: provider as ProviderSlug,
            mode,
            prompt,
            imageUrl: normalizedPayload.imageDataUrl,
            multiViewImages: multiViewImages.length > 0 ? multiViewImages : undefined,
            meshUrl: resolvedMeshUrl,
            resolution,
            textureResolution,
            targetFaces,
            outputFormat: "glb",
        })

        const viewerUrl = resolveViewerUrl(result)

        if (result.status !== "completed" || !viewerUrl) {
            return NextResponse.json(
                {
                    ...result,
                    viewerUrl,
                },
                { status: 422 },
            )
        }

        return NextResponse.json({
            ...result,
            viewerUrl,
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
