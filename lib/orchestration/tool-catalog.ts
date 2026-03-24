/**
 * Tool Catalog — Central knowledge base for all ModelForge tools & categories.
 *
 * Provides beginner-friendly metadata, input definitions, and descriptions
 * for every tool and pipeline category in the platform.
 */

import type { ProviderSlug } from "@/lib/neural/types"

// ---------------------------------------------------------------------------
// Input definitions
// ---------------------------------------------------------------------------

export type ToolInputType = "text" | "image" | "mesh" | "select" | "slider"

export interface ToolInput {
    /** Internal key (e.g. "prompt", "imageUrl") */
    key: string
    /** Display label */
    label: string
    type: ToolInputType
    required: boolean
    placeholder?: string
    /** For select inputs */
    options?: { value: string; label: string; description?: string }[]
    /** For slider inputs */
    min?: number
    max?: number
    step?: number
    defaultValue?: number | string
    /** Beginner-friendly help */
    helpText?: string
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export type ToolDifficulty = "beginner" | "intermediate" | "advanced"

export interface ToolEntry {
    /** Unique identifier */
    id: string
    /** Display name */
    name: string
    /** Pipeline category */
    category: StudioCategory
    /** Tool type */
    type: "neural" | "blender_agent" | "manual"
    /** One-line tagline */
    tagline: string
    /** 2-3 sentence description for beginners */
    description: string
    /** What this tool is great at */
    bestFor: string[]
    /** What to avoid using it for */
    notFor: string[]
    difficulty: ToolDifficulty
    /** What the user needs to provide */
    inputs: ToolInput[]
    /** Estimated time */
    estimatedTime: string
    /** Cost per use (empty for free) */
    cost?: string
    /** Neural provider slug (when type === "neural") */
    provider?: ProviderSlug
}

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

export interface CategoryMeta {
    id: StudioCategory
    /** Beginner-friendly label */
    label: string
    icon: string
    /** One-line description a beginner can understand */
    description: string
    /** Detailed help text */
    helpText: string
    /** Order in the pipeline */
    order: number
    /** Which tools are available */
    toolIds: string[]
}

export type StudioCategory =
    | "shape"
    | "cleanup"
    | "unwrap"
    | "paint"
    | "skeleton"
    | "motion"
    | "effects"
    | "lighting"
    | "scene"
    | "rendering"
    | "export"

// ---------------------------------------------------------------------------
// Tool entries
// ---------------------------------------------------------------------------

export const TOOLS: Record<string, ToolEntry> = {
    // ── Shape tools ──────────────────────────────────────────────────
    "blender-agent-shape": {
        id: "blender-agent-shape",
        name: "Blender Agent",
        category: "shape",
        type: "blender_agent",
        tagline: "Describe any shape and AI builds it with code",
        description:
            "Tell the AI what you want in plain language — a castle, a spaceship, a table — and it writes custom Blender Python code to create it. Great for architectural, geometric, and parametric shapes.",
        bestFor: ["Buildings", "Furniture", "Geometric shapes", "Parametric objects", "Environments"],
        notFor: ["Photorealistic characters", "Organic creatures", "Scanned objects"],
        difficulty: "beginner",
        inputs: [
            {
                key: "prompt",
                label: "Describe what you want to create",
                type: "text",
                required: true,
                placeholder: "e.g. A medieval stone castle with two towers and a drawbridge",
                helpText: "Be specific about shape, size, and details. The more you describe, the better the result.",
            },
            {
                key: "referenceImage",
                label: "Reference image (optional)",
                type: "image",
                required: false,
                helpText: "Upload an image for the AI to recreate or use as visual reference.",
            },
        ],
        estimatedTime: "10–60 seconds",
    },

    "hunyuan-shape": {
        id: "hunyuan-shape",
        name: "Hunyuan3D Shape",
        category: "shape",
        type: "neural",
        tagline: "Turn text or images into 3D models using AI",
        description:
            "A neural network that generates 3D shapes from text descriptions or reference images. Best for organic, complex shapes that are hard to model by hand — characters, animals, props.",
        bestFor: ["Characters", "Animals", "Props", "Organic shapes", "Concept art → 3D"],
        notFor: ["Precise dimensions", "Architecture", "Mechanical parts"],
        difficulty: "beginner",
        provider: "hunyuan-shape",
        inputs: [
            {
                key: "prompt",
                label: "Describe the 3D model",
                type: "text",
                required: false,
                placeholder: "e.g. A cute cartoon dragon with small wings",
                helpText: "Keep it simple — short descriptions often work better than long ones.",
            },
            {
                key: "imageUrl",
                label: "Or upload a reference image",
                type: "image",
                required: false,
                helpText: "Upload a photo, drawing, or concept art. The AI will try to match it in 3D.",
            },
        ],
        estimatedTime: "10–60 seconds",
        cost: "~$0.05",
    },

    trellis: {
        id: "trellis",
        name: "TRELLIS 2",
        category: "shape",
        type: "neural",
        tagline: "Image to 3D with built-in textures",
        description:
            "Microsoft's TRELLIS 2 converts a single image into a textured 3D model. It generates both the shape AND basic colors/materials in one step.",
        bestFor: ["Image-to-3D conversion", "Props with textures", "Quick prototyping"],
        notFor: ["Text-only prompts", "High-poly characters", "Precise geometry"],
        difficulty: "beginner",
        provider: "trellis",
        inputs: [
            {
                key: "imageUrl",
                label: "Upload a reference image",
                type: "image",
                required: true,
                helpText: "A clear photo or illustration on a simple background works best.",
            },
            {
                key: "resolution",
                label: "Quality",
                type: "select",
                required: false,
                defaultValue: "512",
                options: [
                    { value: "512", label: "Standard", description: "Faster, good for previews" },
                    { value: "1024", label: "High", description: "More detail, takes longer" },
                    { value: "1536", label: "Ultra", description: "Maximum detail" },
                ],
                helpText: "Higher quality = more detail but takes longer to generate.",
            },
        ],
        estimatedTime: "3–60 seconds",
        cost: "~$0.25",
    },

    // ── Cleanup tools ────────────────────────────────────────────────
    "blender-agent-cleanup": {
        id: "blender-agent-cleanup",
        name: "Blender Agent",
        category: "cleanup",
        type: "blender_agent",
        tagline: "Fix, optimize, and polish your mesh",
        description:
            "Clean up mesh issues — decimate high-poly models, fix normals, merge vertices, smooth surfaces, and optimize for your target platform.",
        bestFor: ["Reducing poly count", "Fixing normals", "Merging vertices", "Smoothing"],
        notFor: ["Creating new geometry", "Texturing"],
        difficulty: "beginner",
        inputs: [
            {
                key: "prompt",
                label: "Describe what needs cleaning",
                type: "text",
                required: true,
                placeholder: "e.g. Reduce polygon count and fix normals",
                helpText: "Describe what needs fixing — polygon count, holes, smoothing, etc.",
            },
        ],
        estimatedTime: "5–30 seconds",
    },

    "meshanything-v2": {
        id: "meshanything-v2",
        name: "MeshAnything V2",
        category: "cleanup",
        type: "neural",
        tagline: "AI-powered auto-retopology for clean quad meshes",
        description:
            "Converts messy neural-generated or sculpted meshes into clean, artist-grade quad-dominant topology. Perfect for turning raw AI geometry into animation-ready meshes with up to 1,600 faces.",
        bestFor: ["Neural mesh cleanup", "Quad remesh", "Animation-ready topology", "Game-ready meshes"],
        notFor: ["High-poly sculpts (>50K faces)", "Simple primitive shapes"],
        difficulty: "beginner",
        provider: "meshanything-v2",
        inputs: [
            {
                key: "meshUrl",
                label: "Select mesh to retopologize",
                type: "mesh",
                required: true,
                helpText: "Pick the 3D model you want to retopologize into clean quads.",
            },
            {
                key: "targetFaces",
                label: "Target face count",
                type: "slider",
                required: false,
                min: 100,
                max: 1600,
                step: 100,
                defaultValue: 800,
                helpText: "How many faces the output mesh should have (max 1,600).",
            },
        ],
        estimatedTime: "10–45 seconds",
        cost: "RunPod usage",
    },

    "hunyuan-part": {
        id: "hunyuan-part",
        name: "Hunyuan3D Part",
        category: "cleanup",
        type: "neural",
        tagline: "Split a model into labeled parts",
        description:
            "Uses AI to automatically identify and separate different parts of a 3D model — like splitting a character into head, body, arms, and legs. Useful for rigging and texturing.",
        bestFor: ["Character segmentation", "Part labeling", "Preparing for rigging"],
        notFor: ["Simple objects", "Polygon reduction"],
        difficulty: "intermediate",
        provider: "hunyuan-part",
        inputs: [
            {
                key: "meshUrl",
                label: "Select mesh to segment",
                type: "mesh",
                required: true,
                helpText: "Choose a 3D model from your scene to split into parts.",
            },
        ],
        estimatedTime: "5–30 seconds",
        cost: "RunPod usage",
    },

    // ── Unwrap tools ─────────────────────────────────────────────────
    "blender-agent-unwrap": {
        id: "blender-agent-unwrap",
        name: "Blender Agent",
        category: "unwrap",
        type: "blender_agent",
        tagline: "Automatically prepare surfaces for texturing",
        description:
            "UV unwrapping is like unfolding a 3D shape into a flat surface so textures can be painted on it correctly. The AI handles this automatically — you don't need to understand the technical details.",
        bestFor: ["Any model that needs textures", "Automatic UV layout"],
        notFor: ["Models that already have good UVs"],
        difficulty: "beginner",
        inputs: [
            {
                key: "prompt",
                label: "UV unwrap instructions (optional)",
                type: "text",
                required: false,
                placeholder: "e.g. Smart UV project with even texel density",
                helpText: "Leave empty for automatic unwrapping, or specify a method if you know what you want.",
            },
        ],
        estimatedTime: "5–15 seconds",
    },

    // ── Paint tools ──────────────────────────────────────────────────
    "blender-agent-paint": {
        id: "blender-agent-paint",
        name: "Blender Agent",
        category: "paint",
        type: "blender_agent",
        tagline: "Create materials and textures with code",
        description:
            "The AI generates procedural materials (metal, glass, wood, fabric, etc.) using Blender's node system. Great for stylized and procedural looks.",
        bestFor: ["Procedural materials", "Stylized art", "Quick material setup"],
        notFor: ["Photorealistic textures from images", "Ultra-high-res textures"],
        difficulty: "beginner",
        inputs: [
            {
                key: "prompt",
                label: "Describe the material or texture",
                type: "text",
                required: true,
                placeholder: "e.g. Worn rusty metal with scratches and chipped paint",
                helpText: "Describe the look you want — color, roughness, patterns, wear effects.",
            },
        ],
        estimatedTime: "5–20 seconds",
    },

    "hunyuan-paint": {
        id: "hunyuan-paint",
        name: "Hunyuan3D Paint",
        category: "paint",
        type: "neural",
        tagline: "AI-powered PBR texturing for any mesh",
        description:
            "Automatically paints realistic PBR textures (color, roughness, metallic, normals) onto an existing 3D model. Turn a grey mesh into a fully textured asset.",
        bestFor: ["Realistic textures", "Character texturing", "PBR materials"],
        notFor: ["Stylized/toon looks", "Simple flat colors"],
        difficulty: "beginner",
        provider: "hunyuan-paint",
        inputs: [
            {
                key: "meshUrl",
                label: "Select mesh to texture",
                type: "mesh",
                required: true,
                helpText: "Pick the 3D model you want to add textures to.",
            },
            {
                key: "imageUrl",
                label: "Reference image (optional)",
                type: "image",
                required: false,
                helpText: "Upload an image showing the colors/style you want.",
            },
        ],
        estimatedTime: "15–90 seconds",
        cost: "RunPod usage",
    },

    yvo3d: {
        id: "yvo3d",
        name: "YVO3D",
        category: "paint",
        type: "neural",
        tagline: "Premium texturing up to 8K resolution",
        description:
            "Professional-grade AI texturing service. Produces the highest quality PBR textures available — up to 8K resolution for film and AAA game production.",
        bestFor: ["Film/VFX quality", "AAA game assets", "Ultra-high resolution"],
        notFor: ["Quick prototypes", "Low-poly models"],
        difficulty: "intermediate",
        provider: "yvo3d",
        inputs: [
            {
                key: "meshUrl",
                label: "Select mesh to texture",
                type: "mesh",
                required: true,
                helpText: "Choose the model you want premium textures on.",
            },
            {
                key: "textureResolution",
                label: "Texture Resolution",
                type: "select",
                required: false,
                defaultValue: "2K",
                options: [
                    { value: "1K", label: "1K (1024px)", description: "Fast, mobile-friendly" },
                    { value: "2K", label: "2K (2048px)", description: "Good balance of quality and speed" },
                    { value: "FAST4K", label: "Fast 4K", description: "High quality, faster processing" },
                    { value: "REAL4K", label: "Real 4K (4096px)", description: "Full 4K detail" },
                    { value: "ULTIMA8K", label: "Ultima 8K (8192px)", description: "Maximum quality for film" },
                ],
                helpText: "Higher resolution = sharper textures but longer processing time.",
            },
        ],
        estimatedTime: "10–120 seconds",
        cost: "API credits",
    },

    // ── Skeleton tools ───────────────────────────────────────────────
    "blender-agent-skeleton": {
        id: "blender-agent-skeleton",
        name: "Blender Agent",
        category: "skeleton",
        type: "blender_agent",
        tagline: "Add bones and auto-rig for animation",
        description:
            "Adds an internal skeleton (armature) to your model so it can be posed and animated. Uses Blender's Rigify system for professional-quality rigs with automatic weight painting.",
        bestFor: ["Characters", "Creatures", "Mechanical rigs"],
        notFor: ["Static props", "Environment pieces"],
        difficulty: "intermediate",
        inputs: [
            {
                key: "prompt",
                label: "Rigging instructions",
                type: "text",
                required: true,
                placeholder: "e.g. Add a biped rig to the character with IK controls",
                helpText: "Describe what kind of rig you need — biped, quadruped, mechanical, etc.",
            },
        ],
        estimatedTime: "10–30 seconds",
    },

    unirig: {
        id: "unirig",
        name: "UniRig AI",
        category: "skeleton",
        type: "neural",
        tagline: "AI auto-rigging with skeleton + skin weights",
        description:
            "Uses a GPT-like transformer (SIGGRAPH 2025) to automatically generate a skeleton and compute skinning weights for any 3D model. Works on humanoids, animals, and objects — no manual bone placement needed.",
        bestFor: ["Characters", "Creatures", "Any organic shape", "Batch auto-rigging"],
        notFor: ["Mechanical rigs with IK", "Custom control shapes"],
        difficulty: "beginner",
        provider: "unirig",
        inputs: [
            {
                key: "meshUrl",
                label: "Select mesh to auto-rig",
                type: "mesh",
                required: true,
                helpText: "Pick the 3D model you want to add a skeleton to.",
            },
        ],
        estimatedTime: "15–60 seconds",
        cost: "RunPod usage",
    },

    // ── Motion tools ─────────────────────────────────────────────────
    "blender-agent-motion": {
        id: "blender-agent-motion",
        name: "Blender Agent",
        category: "motion",
        type: "blender_agent",
        tagline: "Animate with physics, keyframes, and camera moves",
        description:
            "Create animations procedurally — walk cycles, camera orbits, physics simulations, turntable presentations, and more. The AI generates animation code based on your description.",
        bestFor: ["Camera animations", "Turntables", "Simple character animation", "Physics"],
        notFor: ["Complex character acting", "Facial animation"],
        difficulty: "intermediate",
        inputs: [
            {
                key: "prompt",
                label: "Describe the animation",
                type: "text",
                required: true,
                placeholder: "e.g. Slow 360° turntable rotation over 120 frames",
                helpText: "Describe the motion — what moves, how fast, for how long.",
            },
        ],
        estimatedTime: "5–30 seconds",
    },

    momask: {
        id: "momask",
        name: "MoMask AI",
        category: "motion",
        type: "neural",
        tagline: "AI text-to-motion — describe any human movement",
        description:
            "Generate realistic human motion data from text descriptions using MoMask (CVPR 2024). Outputs BVH motion capture files that can be applied to rigged characters. Supports walking, running, dancing, gestures, and more.",
        bestFor: ["Walk cycles", "Dance moves", "Gestures", "Action sequences"],
        notFor: ["Camera animation", "Object motion", "Facial animation"],
        difficulty: "beginner",
        provider: "momask",
        inputs: [
            {
                key: "prompt",
                label: "Describe the motion",
                type: "text",
                required: true,
                placeholder: "e.g. A person walks forward casually then waves hello",
                helpText: "Describe the human motion you want — actions, speed, style.",
            },
            {
                key: "motionDuration",
                label: "Duration (seconds)",
                type: "slider",
                required: false,
                min: 1,
                max: 10,
                step: 1,
                defaultValue: 4,
                helpText: "How long the generated motion should last.",
            },
        ],
        estimatedTime: "5–30 seconds",
        cost: "RunPod usage",
    },

    // ── Effects tools ────────────────────────────────────────────────
    "blender-agent-effects": {
        id: "blender-agent-effects",
        name: "Blender Agent",
        category: "effects",
        type: "blender_agent",
        tagline: "Particles, fire, rain, portals, and more",
        description:
            "Create visual effects using Blender's particle systems, physics, and shader nodes. From realistic rain and fire to magical portals and explosions.",
        bestFor: ["Particle effects", "Fire & smoke", "Rain & weather", "Magic effects"],
        notFor: ["Static materials", "Geometry creation"],
        difficulty: "intermediate",
        inputs: [
            {
                key: "prompt",
                label: "Describe the effect",
                type: "text",
                required: true,
                placeholder: "e.g. Magical purple particle portal with swirling energy",
                helpText: "Describe the visual effect you want — type, color, intensity, behavior.",
            },
        ],
        estimatedTime: "5–30 seconds",
    },

    // ── Lighting tools ───────────────────────────────────────────────
    "blender-agent-lighting": {
        id: "blender-agent-lighting",
        name: "Blender Agent",
        category: "lighting",
        type: "blender_agent",
        tagline: "Set up professional lighting and HDRI",
        description:
            "Configure scene lighting — studio setups, dramatic lighting, HDRI environments, and atmosphere. The AI sets up lights, shadows, and environment maps.",
        bestFor: ["Studio lighting", "Outdoor scenes", "HDRI environments", "Mood lighting"],
        notFor: ["Texturing", "Geometry"],
        difficulty: "beginner",
        inputs: [
            {
                key: "prompt",
                label: "Describe the lighting setup",
                type: "text",
                required: true,
                placeholder: "e.g. Warm sunset lighting with soft shadows and golden hour atmosphere",
                helpText: "Describe the mood, direction, and intensity of light you want.",
            },
        ],
        estimatedTime: "5–15 seconds",
    },

    // ── Scene composition ────────────────────────────────────────────
    "blender-agent-scene": {
        id: "blender-agent-scene",
        name: "Blender Agent",
        category: "scene",
        type: "blender_agent",
        tagline: "Arrange, compose, and build environments",
        description:
            "Place and arrange objects in your scene, set up cameras, create backgrounds, and build full environments. Great for product shots, game levels, and architectural layouts.",
        bestFor: ["Product displays", "Game levels", "Architectural visualization"],
        notFor: ["Individual model creation", "Texturing"],
        difficulty: "beginner",
        inputs: [
            {
                key: "prompt",
                label: "Describe the scene layout",
                type: "text",
                required: true,
                placeholder: "e.g. Place the sword on a stone pedestal with a dark backdrop",
                helpText: "Describe where objects should go, camera angle, and background.",
            },
        ],
        estimatedTime: "5–30 seconds",
    },

    // ── Rendering tools ──────────────────────────────────────────────
    "blender-agent-rendering": {
        id: "blender-agent-rendering",
        name: "Blender Agent",
        category: "rendering",
        type: "blender_agent",
        tagline: "Configure render engine, quality, and style",
        description:
            "Set up the render engine (EEVEE for fast previews, Cycles for photorealism), configure quality settings, and choose render styles like toon/cel-shading or product photography.",
        bestFor: ["Render setup", "Style configuration", "Quality optimization"],
        notFor: ["Creating geometry", "Animation"],
        difficulty: "intermediate",
        inputs: [
            {
                key: "prompt",
                label: "Describe the render setup",
                type: "text",
                required: true,
                placeholder: "e.g. Photorealistic Cycles render at 1920x1080 with 128 samples",
                helpText: "Describe the engine, resolution, quality, and style you want.",
            },
        ],
        estimatedTime: "5–15 seconds",
    },

    // ── Export tools ─────────────────────────────────────────────────
    "blender-agent-export": {
        id: "blender-agent-export",
        name: "Blender Agent",
        category: "export",
        type: "blender_agent",
        tagline: "Save for games, film, web, or 3D printing",
        description:
            "Export your model in industry-standard formats: GLB/glTF for web and games, FBX for Unity/Unreal, USD for film pipelines, or STL for 3D printing. Includes LOD generation for performance.",
        bestFor: ["Game assets (GLB, FBX)", "Film/VFX (USD)", "Web (glTF)", "3D printing (STL)"],
        notFor: ["Editing — export is the final step"],
        difficulty: "beginner",
        inputs: [
            {
                key: "prompt",
                label: "Export instructions",
                type: "text",
                required: true,
                placeholder: "e.g. Export as GLB with 3 LOD levels for a web game",
                helpText: "Specify the format and any special requirements (LODs, compression, etc.).",
            },
        ],
        estimatedTime: "5–20 seconds",
    },
}

// ---------------------------------------------------------------------------
// Category catalogue
// ---------------------------------------------------------------------------

export const CATEGORIES: CategoryMeta[] = [
    {
        id: "shape",
        label: "Shape",
        icon: "🧊",
        description: "Create the basic 3D form",
        helpText: "This is where every project starts. Create a 3D shape from scratch — either by describing it in words, uploading an image, or using AI to generate it.",
        order: 1,
        toolIds: ["blender-agent-shape", "hunyuan-shape", "trellis"],
    },
    {
        id: "cleanup",
        label: "Cleanup",
        icon: "🔧",
        description: "Optimize and fix mesh quality",
        helpText: "After creating a shape, you may need to clean it up — reduce the number of polygons for better performance, fix any holes or broken surfaces, or split it into separate parts.",
        order: 2,
        toolIds: ["blender-agent-cleanup", "hunyuan-part", "meshanything-v2"],
    },
    {
        id: "unwrap",
        label: "Unwrap",
        icon: "📐",
        description: "Prepare surfaces for texturing",
        helpText: "Think of it like peeling an orange and laying the skin flat. UV unwrapping flattens your 3D surface so textures can be painted on correctly. Usually done automatically.",
        order: 3,
        toolIds: ["blender-agent-unwrap"],
    },
    {
        id: "paint",
        label: "Paint",
        icon: "🎨",
        description: "Add colors, materials, and textures",
        helpText: "Make your model look real (or stylized). Add materials like metal, wood, fabric, or use AI to paint realistic textures directly onto your 3D model.",
        order: 4,
        toolIds: ["blender-agent-paint", "hunyuan-paint", "yvo3d"],
    },
    {
        id: "skeleton",
        label: "Skeleton",
        icon: "🦴",
        description: "Add bones so your model can move",
        helpText: "Like a real skeleton inside a body, a 3D rig gives your model joints and bones. This step is required before you can animate characters or creatures.",
        order: 5,
        toolIds: ["blender-agent-skeleton", "unirig"],
    },
    {
        id: "motion",
        label: "Motion",
        icon: "🎬",
        description: "Animate — movement, cameras, physics",
        helpText: "Make things move! Create walk cycles, camera orbits, physics simulations, or any kind of animation. Requires a skeleton for character animation.",
        order: 6,
        toolIds: ["blender-agent-motion", "momask"],
    },
    {
        id: "effects",
        label: "Effects",
        icon: "✨",
        description: "VFX — fire, rain, particles, magic",
        helpText: "Add visual effects to your scene — fire, smoke, rain, snow, explosions, magical portals, lightning, sparks, and more using Blender's particle and physics systems.",
        order: 7,
        toolIds: ["blender-agent-effects"],
    },
    {
        id: "lighting",
        label: "Lighting",
        icon: "💡",
        description: "Set up lights and atmosphere",
        helpText: "Good lighting makes or breaks a scene. Set up studio lights, outdoor environments with HDRI images, dramatic shadows, or cozy ambient lighting.",
        order: 8,
        toolIds: ["blender-agent-lighting"],
    },
    {
        id: "scene",
        label: "Scene",
        icon: "🏗️",
        description: "Arrange objects and cameras",
        helpText: "Compose your final scene — position objects, set up camera angles, create backgrounds, and arrange everything for the perfect shot or game level.",
        order: 9,
        toolIds: ["blender-agent-scene"],
    },
    {
        id: "rendering",
        label: "Render",
        icon: "📸",
        description: "Configure render quality and style",
        helpText: "Choose how your final image or video looks. Pick between fast preview (EEVEE) or photorealistic (Cycles), set resolution, and configure the visual style.",
        order: 10,
        toolIds: ["blender-agent-rendering"],
    },
    {
        id: "export",
        label: "Export",
        icon: "📦",
        description: "Save for games, film, or 3D printing",
        helpText: "Save your finished model in the right format for your project — GLB for web, FBX for game engines, USD for film, or STL for 3D printing.",
        order: 11,
        toolIds: ["blender-agent-export"],
    },
]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getToolById(id: string): ToolEntry | undefined {
    return TOOLS[id]
}

export function getToolsForCategory(category: StudioCategory): ToolEntry[] {
    return CATEGORIES.find((c) => c.id === category)
        ?.toolIds.map((id) => TOOLS[id])
        .filter(Boolean) as ToolEntry[] ?? []
}

export function getCategoryById(id: StudioCategory): CategoryMeta | undefined {
    return CATEGORIES.find((c) => c.id === id)
}

export function getAllToolEntries(): ToolEntry[] {
    return Object.values(TOOLS)
}
