/**
 * Neural 3D Generation — Provider Registry
 *
 * Central catalogue of all available neural providers, with helper functions
 * to look up providers by pipeline stage, select the best one, and
 * instantiate client instances via a factory.
 */

import type { Neural3DProviderMeta, PipelineStage, ProviderSlug } from "./types"
import type { Neural3DClient } from "./base-client"

// ---------------------------------------------------------------------------
// Provider metadata catalogue
// ---------------------------------------------------------------------------

export const PROVIDERS: Record<ProviderSlug, Neural3DProviderMeta> = {
    "hunyuan-shape": {
        slug: "hunyuan-shape",
        name: "Hunyuan3D Shape 2.1",
        stages: ["geometry"],
        modes: ["image_to_3d", "text_to_3d"],
        selfHosted: true,
        outputFormats: ["glb", "obj"],
        estimatedTime: { min: 10, max: 60 },
        vramGb: 10,
    },
    "hunyuan-paint": {
        slug: "hunyuan-paint",
        name: "Hunyuan3D Paint 2.1",
        stages: ["texturing"],
        modes: ["mesh_to_texture"],
        selfHosted: true,
        outputFormats: ["glb"],
        estimatedTime: { min: 15, max: 90 },
        vramGb: 21,
    },
    "hunyuan-part": {
        slug: "hunyuan-part",
        name: "Hunyuan3D Part",
        stages: ["segmentation"],
        modes: ["mesh_to_parts"],
        selfHosted: true,
        outputFormats: ["glb", "obj"],
        estimatedTime: { min: 5, max: 30 },
    },
    trellis: {
        slug: "trellis",
        name: "TRELLIS 2 (Microsoft)",
        stages: ["geometry", "texturing"],
        modes: ["image_to_3d"],
        selfHosted: true,
        outputFormats: ["glb"],
        estimatedTime: { min: 3, max: 60 },
        vramGb: 24,
    },
    yvo3d: {
        slug: "yvo3d",
        name: "YVO3D",
        stages: ["texturing"],
        modes: ["mesh_to_texture", "image_to_3d"],
        selfHosted: false,
        outputFormats: ["glb", "obj"],
        estimatedTime: { min: 10, max: 120 },
    },
    unirig: {
        slug: "unirig",
        name: "UniRig (Auto-Rigging)",
        stages: ["rigging"],
        modes: ["mesh_to_rig"],
        selfHosted: true,
        outputFormats: ["glb"],
        estimatedTime: { min: 15, max: 60 },
        vramGb: 16,
    },
    momask: {
        slug: "momask",
        name: "MoMask (Text-to-Motion)",
        stages: ["animation"],
        modes: ["text_to_motion"],
        selfHosted: true,
        outputFormats: ["bvh", "fbx"],
        estimatedTime: { min: 5, max: 30 },
        vramGb: 8,
    },
    "meshanything-v2": {
        slug: "meshanything-v2",
        name: "MeshAnything V2 (Retopology)",
        stages: ["retopology"],
        modes: ["mesh_to_retopo"],
        selfHosted: true,
        outputFormats: ["glb", "obj"],
        estimatedTime: { min: 10, max: 45 },
        vramGb: 12,
    },
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Return all providers that can handle the given pipeline stage. */
export function getProvidersForStage(stage: PipelineStage): Neural3DProviderMeta[] {
    return Object.values(PROVIDERS).filter((p) => p.stages.includes(stage))
}

/**
 * Pick the best provider for a given pipeline stage.
 *
 * Strategy:
 *  1. Prefer self-hosted providers (lower cost, full control).
 *  2. Among self-hosted, pick the one with lower VRAM (more accessible).
 *  3. Fall back to third-party APIs if no self-hosted option exists.
 *  4. If `preferredSlug` is provided and valid for the stage, use it.
 */
export function selectBestProvider(
    stage: PipelineStage,
    preferredSlug?: ProviderSlug,
): Neural3DProviderMeta | null {
    const candidates = getProvidersForStage(stage)
    if (candidates.length === 0) return null

    // If the caller has a preference and it supports this stage, use it.
    if (preferredSlug) {
        const preferred = candidates.find((p) => p.slug === preferredSlug)
        if (preferred) return preferred
    }

    // Sort: self-hosted first, then by lower VRAM
    const sorted = [...candidates].sort((a, b) => {
        if (a.selfHosted !== b.selfHosted) return a.selfHosted ? -1 : 1
        return (a.vramGb ?? 999) - (b.vramGb ?? 999)
    })

    return sorted[0]
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

/**
 * Create a concrete Neural3DClient for the given provider slug.
 *
 * Uses dynamic imports to avoid loading every provider's dependencies
 * upfront (they may have heavy optional packages like @gradio/client).
 *
 * Provider routing (in priority order):
 *  1. fal.ai: TRELLIS always prefers fal when available
 *  2. RunPod Serverless: paint / segmentation / rigging / motion / retopo
 *  3. Self-hosted: local endpoints and explicit self-hosted overrides
 *
 * Notes:
 *  - `NEURAL_PROVIDER=runpod` should not break TRELLIS, because RunPod does
 *    not provide a TRELLIS backend in this repo.
 *  - Hunyuan Shape stays self-hosted by default for now to preserve the
 *    current Studio prompt flow until the full provider/input audit lands.
 */
export async function createNeuralClient(slug: ProviderSlug): Promise<Neural3DClient> {
    const providerPreference = (process.env.NEURAL_PROVIDER ?? "").trim().toLowerCase()
    const hasFal = !!process.env.FAL_KEY
    const hasRunPod = !!process.env.RUNPOD_API_KEY
    const hasRunPodPaint = hasRunPod && !!process.env.RUNPOD_ENDPOINT_HUNYUAN_PAINT
    const hasRunPodPart = hasRunPod && !!process.env.RUNPOD_ENDPOINT_HUNYUAN_PART
    const hasSharedHunyuanEndpoint = !!process.env.HUNYUAN_API_URL
    const hasDedicatedShapeEndpoint = !!process.env.HUNYUAN_SHAPE_API_URL || hasSharedHunyuanEndpoint
    const hasDedicatedPaintEndpoint = !!process.env.HUNYUAN_PAINT_API_URL || hasSharedHunyuanEndpoint
    const forceSelfHosted = providerPreference === "self-hosted"
    const forceFal = providerPreference === "fal"

    // TRELLIS currently rides on fal unless the user explicitly forces
    // self-hosted mode. This avoids breaking image-to-3D when
    // NEURAL_PROVIDER=runpod is used for other models.
    if (slug === "trellis" && !forceSelfHosted && hasFal) {
        const { FalClient } = await import("./providers/fal-client")
        return new FalClient("trellis")
    }

    // Keep Hunyuan Shape on the existing self-hosted path by default.
    // Only switch it to fal when explicitly requested.
    if (slug === "hunyuan-shape" && forceFal && hasFal) {
        const { FalClient } = await import("./providers/fal-client")
        return new FalClient("hunyuan-shape")
    }

    // Dedicated Azure/self-hosted endpoints should win over RunPod when set.
    if (slug === "hunyuan-shape" && hasDedicatedShapeEndpoint) {
        const { HunyuanShapeClient } = await import("./providers/hunyuan-shape")
        return new HunyuanShapeClient()
    }
    if (slug === "hunyuan-paint" && hasDedicatedPaintEndpoint) {
        const { HunyuanPaintClient } = await import("./providers/hunyuan-paint")
        return new HunyuanPaintClient()
    }

    // RunPod Serverless routing for models without hosted APIs
    if (
        !forceSelfHosted &&
        ((slug === "hunyuan-paint" && hasRunPodPaint) || (slug === "hunyuan-part" && hasRunPodPart))
    ) {
        const { RunPodClient } = await import("./providers/runpod-client")
        return new RunPodClient(slug)
    }

    // RunPod routing for new neural models (UniRig, MoMask, MeshAnything V2)
    if (!forceSelfHosted && hasRunPod && slug === "unirig") {
        const { UniRigClient } = await import("./providers/unirig-client")
        return new UniRigClient()
    }
    if (!forceSelfHosted && hasRunPod && slug === "momask") {
        const { MoMaskClient } = await import("./providers/momask-client")
        return new MoMaskClient()
    }
    if (!forceSelfHosted && hasRunPod && slug === "meshanything-v2") {
        const { MeshAnythingV2Client } = await import("./providers/meshanything-v2-client")
        return new MeshAnythingV2Client()
    }

    // Self-hosted / provider-specific routing
    switch (slug) {
        case "hunyuan-shape": {
            const { HunyuanShapeClient } = await import("./providers/hunyuan-shape")
            return new HunyuanShapeClient()
        }
        case "hunyuan-paint": {
            const { HunyuanPaintClient } = await import("./providers/hunyuan-paint")
            return new HunyuanPaintClient()
        }
        case "hunyuan-part": {
            const { HunyuanPartClient } = await import("./providers/hunyuan-part")
            return new HunyuanPartClient()
        }
        case "trellis": {
            const { TrellisClient } = await import("./providers/trellis")
            return new TrellisClient()
        }
        case "yvo3d": {
            const { Yvo3dClient } = await import("./providers/yvo3d")
            return new Yvo3dClient()
        }
        case "unirig": {
            const { UniRigClient } = await import("./providers/unirig-client")
            return new UniRigClient()
        }
        case "momask": {
            const { MoMaskClient } = await import("./providers/momask-client")
            return new MoMaskClient()
        }
        case "meshanything-v2": {
            const { MeshAnythingV2Client } = await import("./providers/meshanything-v2-client")
            return new MeshAnythingV2Client()
        }
        default:
            throw new Error(`Unknown neural provider slug: ${slug}`)
    }
}
