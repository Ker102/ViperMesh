/**
 * Neural 3D Generation — Core Types
 *
 * Defines the provider abstraction, pipeline stages, and request/result
 * interfaces used by all neural provider clients.
 */

import type { MultiViewImageInput } from "./multiview"

// ---------------------------------------------------------------------------
// Provider & Pipeline Enums
// ---------------------------------------------------------------------------

/** Unique slug for each neural provider implementation */
export type ProviderSlug =
    | "hunyuan-shape"
    | "hunyuan-paint"
    | "hunyuan-part"
    | "trellis"
    | "yvo3d"
    | "unirig"
    | "momask"
    | "meshanything-v2"

/** Stages of the full 3D production pipeline */
export type PipelineStage =
    | "geometry"
    | "texturing"
    | "retopology"
    | "segmentation"
    | "rigging"
    | "animation"
    | "export"

/** The mode of generation supported by a provider */
export type GenerationMode =
    | "text_to_3d"
    | "image_to_3d"
    | "mesh_to_texture"
    | "mesh_to_parts"
    | "mesh_to_rig"
    | "text_to_motion"
    | "mesh_to_retopo"

// ---------------------------------------------------------------------------
// Provider Metadata
// ---------------------------------------------------------------------------

/** Static metadata describing a neural provider's capabilities */
export interface Neural3DProviderMeta {
    slug: ProviderSlug
    name: string
    /** Pipeline stages this provider can handle */
    stages: PipelineStage[]
    /** Generation modes supported */
    modes: GenerationMode[]
    /** Whether we self-host or use a third-party API */
    selfHosted: boolean
    /** Supported output mesh formats */
    outputFormats: string[]
    /** Estimated generation time range in seconds */
    estimatedTime: { min: number; max: number }
    /** Approximate VRAM requirement in GB (self-hosted only) */
    vramGb?: number
    /** Reference-image input limits and multi-view support, when available */
    imageInputs?: {
        maxImages: number
        multiView: boolean
        requiredRoles?: MultiViewImageInput["role"][]
        roles?: MultiViewImageInput["role"][]
    }
}

// ---------------------------------------------------------------------------
// Generation Request / Result
// ---------------------------------------------------------------------------

export interface GenerationRequest {
    /** Text prompt (for text_to_3d mode) */
    prompt?: string
    /** Reference image — base64-encoded data URI or public URL */
    imageUrl?: string
    /** Optional provider-aware multi-view reference images */
    multiViewImages?: MultiViewImageInput[]
    /** Existing mesh URL or local path (for mesh_to_texture / mesh_to_parts / mesh_to_rig / mesh_to_retopo) */
    meshUrl?: string
    /** Motion duration in seconds (for text_to_motion — MoMask) */
    motionDuration?: number
    /** Motion format preference: "bvh" | "fbx" (MoMask output) */
    motionFormat?: "bvh" | "fbx"
    /** Target face count for retopology (MeshAnything V2, max 1600) */
    targetFaces?: number
    /** Provider to use */
    provider: ProviderSlug
    /** Generation mode */
    mode: GenerationMode
    /** Voxel/mesh resolution (TRELLIS: 512/1024/1536) */
    resolution?: number
    /** Texture resolution (YVO3D: "1K"|"2K"|"FAST4K"|"REAL4K"|"ULTIMA8K") */
    textureResolution?: string
    /** Output format preference */
    outputFormat?: "glb" | "obj"
    /** Enable turbo / fast mode where supported */
    turbo?: boolean
}

export interface GenerationResult {
    status: "pending" | "processing" | "completed" | "failed"
    /** Progress 0-100 (if the provider supports incremental updates) */
    progress?: number
    /** Local file path to the downloaded output model */
    modelPath?: string
    /** Path to rigged model output — GLB with embedded armature (UniRig) */
    riggedModelPath?: string
    /** Path to motion data file — BVH/FBX (MoMask) */
    motionPath?: string
    /** Path to retopologized mesh (MeshAnything V2) */
    retopologyPath?: string
    /** Which provider produced this result */
    provider: ProviderSlug
    /** Which pipeline stage was executed */
    stage: PipelineStage
    /** Wall-clock generation time in milliseconds */
    generationTimeMs?: number
    /** Error message if status === "failed" */
    error?: string
}

// ---------------------------------------------------------------------------
// Hybrid Pipeline
// ---------------------------------------------------------------------------

/** Configuration for the full hybrid pipeline run */
export interface HybridPipelineOptions {
    /** Provider for geometry stage (default: "hunyuan-shape") */
    geometryProvider?: ProviderSlug
    /** Provider for texturing stage (default: "hunyuan-paint") */
    textureProvider?: ProviderSlug
    /** Whether to run segmentation via Hunyuan Part */
    enableSegmentation?: boolean
    /** Whether to auto-rig via Blender Rigify */
    enableRigging?: boolean
    /** Whether to add procedural animation */
    enableAnimation?: boolean
    /** Export format(s) */
    exportFormats?: ("glb" | "fbx" | "obj" | "usd")[]
    /** Skip stages that fail instead of aborting the entire pipeline */
    gracefulDegradation?: boolean
}

/** Status of one stage in the hybrid pipeline */
export interface PipelineStageStatus {
    stage: PipelineStage
    status: "pending" | "running" | "completed" | "skipped" | "failed"
    provider?: ProviderSlug
    durationMs?: number
    error?: string
    outputPath?: string
}
