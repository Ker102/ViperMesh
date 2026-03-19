/**
 * Agents Module (v2 — LangChain v1 + LangGraph)
 *
 * Replaces the hand-rolled ReAct loop with LangChain 1.x `createAgent`
 * and middleware. The legacy implementation is preserved in agents.legacy.ts.
 *
 * Key improvements:
 *  - Built-in ReAct loop with hallucinated tool-call recovery
 *  - Middleware stack: viewport screenshots, context summarization
 *  - Session persistence via MemorySaver (thread_id = project ID)
 *  - LangSmith observability (auto-enabled via env vars)
 */

import { createAgent, createMiddleware, tool } from "langchain"
import { MemorySaver } from "@langchain/langgraph"
import { SystemMessage, isHumanMessage } from "@langchain/core/messages"
import { z } from "zod"

import { createMcpClient, getViewportScreenshot } from "@/lib/mcp"
import type { McpResponse } from "@/lib/mcp"
import { createGeminiModel, DEFAULT_MODEL } from "@/lib/ai"
import { similaritySearch } from "@/lib/ai/vectorstore"
import { formatContextFromSources } from "@/lib/ai/rag"
import type { AgentStreamEvent } from "@/lib/orchestration/types"
import { getAddonPromptHints } from "@/lib/ai/addon-registry"

import { readFileSync, readdirSync, existsSync } from "fs"
import path from "path"

// ============================================================================
// System prompt (read from markdown file at module load time)
// ============================================================================

let SYSTEM_PROMPT: string
try {
  SYSTEM_PROMPT = readFileSync(
    path.join(process.cwd(), "lib/orchestration/prompts/blender-agent-system.md"),
    "utf-8"
  )
} catch {
  SYSTEM_PROMPT = "You are ModelForge, an expert Blender Python Developer."
}

// ============================================================================
// Tool-Guide Binding (loaded from disk at module init, mapped to tool names)
// ============================================================================

/**
 * Map of MCP tool names → full guide markdown content.
 * Built once at module load from `data/tool-guides/*.md` files using
 * their YAML frontmatter `triggered_by` field.
 *
 * Example: { "set_camera_properties" → "<full camera guide content>",
 *            "add_camera" → "<same camera guide content>", ... }
 */
const TOOL_GUIDE_MAP: Record<string, string> = {}

try {
  const guidesDir = path.join(process.cwd(), "data", "tool-guides")
  if (existsSync(guidesDir)) {
    const files = readdirSync(guidesDir).filter((f) => f.endsWith(".md"))
    for (const file of files) {
      const raw = readFileSync(path.join(guidesDir, file), "utf-8")

      // Parse triggered_by from YAML frontmatter
      const triggeredByMatch = raw.match(/triggered_by:\s*\[([^\]]*)\]/)
      if (!triggeredByMatch) continue

      const toolNames = triggeredByMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)

      // Strip YAML frontmatter to get pure markdown body
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim()
      if (!body) continue

      // Map each triggered tool name to this guide's content
      for (const toolName of toolNames) {
        TOOL_GUIDE_MAP[toolName] = body
      }
    }
    console.log(
      `[ToolGuides] Loaded ${files.length} guides, mapped to ${Object.keys(TOOL_GUIDE_MAP).length} tool names`
    )
  }
} catch (error) {
  console.warn("[ToolGuides] Failed to load tool guides:", error)
}

/**
 * Enhance a tool's description by appending its domain guide.
 * If no guide exists for this tool, returns the base description unchanged.
 */
function withGuide(toolName: string, baseDescription: string): string {
  const guide = TOOL_GUIDE_MAP[toolName]
  if (!guide) return baseDescription
  return (
    baseDescription +
    "\n\n--- DOMAIN GUIDE ---\n" +
    "The following domain knowledge MUST be consulted when using this tool. " +
    "Follow these rules and reference values exactly:\n\n" +
    guide
  )
}

// ============================================================================
// MCP Tool Wrappers
// ============================================================================

/**
 * Execute an MCP command and return a stringified result for the agent.
 * Includes the applied parameters in the response so the agent can verify
 * what was configured without needing to call get_scene_info.
 */
async function executeMcpCommand(
  commandType: string,
  params: Record<string, unknown> = {}
): Promise<string> {
  const client = createMcpClient()
  try {
    const response: McpResponse = await client.execute({
      type: commandType,
      params,
    })
    if (response.status === "error") {
      return JSON.stringify({ error: response.message ?? "MCP command failed" })
    }
    // Include the applied parameters in the result so the agent
    // knows exactly what was set without re-querying the scene
    const result = response.result ?? response.raw ?? { status: "ok" }
    const appliedParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    )
    return JSON.stringify({
      ...( typeof result === "object" ? result : { status: result }),
      _applied: appliedParams,
      _command: commandType,
    })
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    await client.close().catch(() => undefined)
  }
}

// ---------- Core Tools ---------

const executeCode = tool(
  async ({ code }: { code: string }) => executeMcpCommand("execute_code", { code }),
  {
    name: "execute_code",
    description:
      "Execute a Blender Python script. Use this for geometry creation, material setup, " +
      "animation, lighting, camera, and any Blender Python API operation. " +
      "Break complex objects into SEPARATE calls — one component per call.",
    schema: z.object({
      code: z.string().describe("The Blender Python script to execute"),
    }),
  }
)

const getSceneInfo = tool(
  async () => executeMcpCommand("get_scene_info"),
  {
    name: "get_scene_info",
    description:
      "Get complete scene information including object list, materials, world settings. " +
      "ALWAYS call this first before making any changes.",
    schema: z.object({}),
  }
)

const getAllObjectInfo = tool(
  async ({ max_objects, start_index }: { max_objects?: number; start_index?: number }) =>
    executeMcpCommand("get_all_object_info", { max_objects, start_index }),
  {
    name: "get_all_object_info",
    description:
      "Get detailed info for all objects in the scene with transforms, materials, mesh stats, " +
      "modifiers, light/camera data. Supports pagination for large scenes.",
    schema: z.object({
      max_objects: z.number().optional().describe("Max objects to return (default 50)"),
      start_index: z.number().optional().describe("Start index for pagination (default 0)"),
    }),
  }
)

const getObjectInfo = tool(
  async ({ name }: { name: string }) =>
    executeMcpCommand("get_object_info", { name }),
  {
    name: "get_object_info",
    description: "Get detailed info about a specific Blender object by name.",
    schema: z.object({
      name: z.string().describe("Name of the Blender object to inspect"),
    }),
  }
)

const getViewportScreenshotTool = tool(
  async () => {
    try {
      const screenshot = await getViewportScreenshot()
      return JSON.stringify({
        status: "ok",
        width: screenshot.width,
        height: screenshot.height,
        format: screenshot.format,
        image_preview: `[Base64 image captured: ${screenshot.width}x${screenshot.height} ${screenshot.format}]`,
      })
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to capture viewport",
      })
    }
  },
  {
    name: "get_viewport_screenshot",
    description:
      "Capture a screenshot of the current Blender viewport for visual verification. " +
      "Use after creating or modifying geometry to confirm the result looks correct.",
    schema: z.object({}),
  }
)

// ---------- Scene Management Tools ---------

const listMaterials = tool(
  async () => executeMcpCommand("list_materials"),
  {
    name: "list_materials",
    description:
      "List all materials in the .blend file with node counts and which objects they are assigned to. " +
      "Use this to inspect the material state before/after texture operations.",
    schema: z.object({}),
  }
)

const deleteObject = tool(
  async ({ name }: { name: string }) =>
    executeMcpCommand("delete_object", { name }),
  {
    name: "delete_object",
    description:
      "Safely delete an object from the Blender scene by name. " +
      "Also cleans up orphaned mesh/curve/light/camera data.",
    schema: z.object({
      name: z.string().describe("Name of the Blender object to delete"),
    }),
  }
)

// ---------- Phase 1A: Transform Tools ---------

const setObjectTransform = tool(
  async ({ name, location, rotation, scale }: { name: string; location?: number[]; rotation?: number[]; scale?: number[] }) =>
    executeMcpCommand("set_object_transform", { name, location, rotation, scale }),
  {
    name: "set_object_transform",
    description:
      "Set an object's location, rotation (in degrees), and/or scale. " +
      "Provide any combination of the three. Rotation uses Euler XYZ in degrees.",
    schema: z.object({
      name: z.string().describe("Name of the Blender object"),
      location: z.array(z.number()).length(3).optional().describe("[x, y, z] world location"),
      rotation: z.array(z.number()).length(3).optional().describe("[x, y, z] rotation in degrees"),
      scale: z.array(z.number()).length(3).optional().describe("[x, y, z] scale factors"),
    }),
  }
)

const renameObject = tool(
  async ({ name, new_name }: { name: string; new_name: string }) =>
    executeMcpCommand("rename_object", { name, new_name }),
  {
    name: "rename_object",
    description: "Rename a Blender object. Also renames its data block if it matches.",
    schema: z.object({
      name: z.string().describe("Current object name"),
      new_name: z.string().describe("New name to assign"),
    }),
  }
)

const duplicateObject = tool(
  async ({ name, new_name, linked }: { name: string; new_name?: string; linked?: boolean }) =>
    executeMcpCommand("duplicate_object", { name, new_name, linked }),
  {
    name: "duplicate_object",
    description:
      "Duplicate a Blender object. Use linked=true to share mesh data (instance). " +
      "Optionally provide new_name for the copy.",
    schema: z.object({
      name: z.string().describe("Name of the object to duplicate"),
      new_name: z.string().optional().describe("Name for the duplicate"),
      linked: z.boolean().optional().describe("If true, share mesh data (linked duplicate)"),
    }),
  }
)

const joinObjects = tool(
  async ({ names }: { names: string[] }) =>
    executeMcpCommand("join_objects", { names }),
  {
    name: "join_objects",
    description:
      "Join multiple MESH objects into one. The first name becomes the target object. " +
      "All others are merged into it.",
    schema: z.object({
      names: z.array(z.string()).min(2).describe("Array of object names to join (first = target)"),
    }),
  }
)

// ---------- Phase 1B: Modifier & Mesh Tools ---------

const addModifier = tool(
  async ({ name, modifier_type, modifier_name, properties }: { name: string; modifier_type: string; modifier_name?: string; properties?: Record<string, unknown> }) =>
    executeMcpCommand("add_modifier", { name, modifier_type, modifier_name, properties }),
  {
    name: "add_modifier",
    description:
      "Add a modifier to an object. Common types: SUBSURF, MIRROR, BEVEL, BOOLEAN, ARRAY, " +
      "SOLIDIFY, DECIMATE, SMOOTH, EDGE_SPLIT, WIREFRAME. " +
      "Use properties dict to set modifier settings (e.g. {levels: 2} for SUBSURF).",
    schema: z.object({
      name: z.string().describe("Target object name"),
      modifier_type: z.string().describe("Modifier type enum (e.g. SUBSURF, MIRROR, BEVEL)"),
      modifier_name: z.string().optional().describe("Custom name for the modifier"),
      properties: z.record(z.unknown()).optional().describe("Modifier properties to set (e.g. {levels: 2})"),
    }),
  }
)

const applyModifier = tool(
  async ({ name, modifier }: { name: string; modifier: string }) =>
    executeMcpCommand("apply_modifier", { name, modifier }),
  {
    name: "apply_modifier",
    description:
      "Apply (bake) a modifier on an object, making its effect permanent and removing it from the stack.",
    schema: z.object({
      name: z.string().describe("Object name"),
      modifier: z.string().describe("Name of the modifier to apply"),
    }),
  }
)

const applyTransforms = tool(
  async ({ name, location, rotation, scale }: { name: string; location?: boolean; rotation?: boolean; scale?: boolean }) =>
    executeMcpCommand("apply_transforms", { name, location, rotation, scale }),
  {
    name: "apply_transforms",
    description:
      "Apply (freeze) an object's transforms to its mesh data. " +
      "Resets location/rotation/scale to identity while keeping visual appearance. " +
      "Essential before exporting models.",
    schema: z.object({
      name: z.string().describe("Object name"),
      location: z.boolean().optional().describe("Apply location (default true)"),
      rotation: z.boolean().optional().describe("Apply rotation (default true)"),
      scale: z.boolean().optional().describe("Apply scale (default true)"),
    }),
  }
)

const shadeSmooth = tool(
  async ({ name, smooth, angle }: { name: string; smooth?: boolean; angle?: number }) =>
    executeMcpCommand("shade_smooth", { name, smooth, angle }),
  {
    name: "shade_smooth",
    description:
      "Set smooth or flat shading on a mesh object. " +
      "Use angle (degrees) for auto-smooth by angle (e.g. 30 = edges sharper than 30° stay sharp).",
    schema: z.object({
      name: z.string().describe("Object name"),
      smooth: z.boolean().optional().describe("True for smooth, false for flat (default true)"),
      angle: z.number().optional().describe("Auto-smooth angle in degrees (e.g. 30)"),
    }),
  }
)

// ---------- Phase 2: Medium-Priority Tools ---------

const parentSet = tool(
  async ({ child_name, parent_name, parent_type }: { child_name: string; parent_name: string; parent_type?: string }) =>
    executeMcpCommand("parent_set", { child_name, parent_name, parent_type }),
  {
    name: "parent_set",
    description:
      "Set a parent-child relationship between two objects. " +
      "The child will follow the parent's transforms.",
    schema: z.object({
      child_name: z.string().describe("Name of the child object"),
      parent_name: z.string().describe("Name of the parent object"),
      parent_type: z.string().optional().describe("Parent type: OBJECT (default), ARMATURE, BONE, etc."),
    }),
  }
)

const parentClear = tool(
  async ({ name, keep_transform }: { name: string; keep_transform?: boolean }) =>
    executeMcpCommand("parent_clear", { name, keep_transform }),
  {
    name: "parent_clear",
    description: "Remove the parent from an object. By default keeps the object's world transform.",
    schema: z.object({
      name: z.string().describe("Object to unparent"),
      keep_transform: z.boolean().optional().describe("Keep world transform after unparenting (default true)"),
    }),
  }
)

const setOrigin = tool(
  async ({ name, origin_type, center }: { name: string; origin_type?: string; center?: string }) =>
    executeMcpCommand("set_origin", { name, origin_type, center }),
  {
    name: "set_origin",
    description:
      "Set the origin (pivot point) of an object. Common types: " +
      "ORIGIN_GEOMETRY (origin to geometry center), ORIGIN_CURSOR (origin to 3D cursor), " +
      "GEOMETRY_ORIGIN (geometry to origin), ORIGIN_CENTER_OF_VOLUME.",
    schema: z.object({
      name: z.string().describe("Object name"),
      origin_type: z.string().optional().describe("Origin type (default ORIGIN_GEOMETRY)"),
      center: z.string().optional().describe("Center calculation: MEDIAN or BOUNDS (default MEDIAN)"),
    }),
  }
)

const moveToCollection = tool(
  async ({ name, collection_name, create_new }: { name: string; collection_name: string; create_new?: boolean }) =>
    executeMcpCommand("move_to_collection", { name, collection_name, create_new }),
  {
    name: "move_to_collection",
    description:
      "Move an object to a Blender collection for organization. " +
      "Set create_new=true to create the collection if it doesn't exist.",
    schema: z.object({
      name: z.string().describe("Object name"),
      collection_name: z.string().describe("Target collection name"),
      create_new: z.boolean().optional().describe("Create collection if it doesn't exist (default false)"),
    }),
  }
)

const setVisibility = tool(
  async ({ name, hide_viewport, hide_render }: { name: string; hide_viewport?: boolean; hide_render?: boolean }) =>
    executeMcpCommand("set_visibility", { name, hide_viewport, hide_render }),
  {
    name: "set_visibility",
    description:
      "Control an object's visibility in the viewport and/or render. " +
      "Set hide_viewport=true to hide in viewport, hide_render=true to hide in renders.",
    schema: z.object({
      name: z.string().describe("Object name"),
      hide_viewport: z.boolean().optional().describe("Hide in viewport"),
      hide_render: z.boolean().optional().describe("Hide in render"),
    }),
  }
)

const exportObject = tool(
  async ({ names, filepath, file_format }: { names: string[]; filepath: string; file_format?: string }) =>
    executeMcpCommand("export_object", { names, filepath, file_format }),
  {
    name: "export_object",
    description:
      "Export one or more objects to a file. Supported formats: GLB (default), GLTF, FBX, OBJ, STL. " +
      "Provide the full filepath including extension.",
    schema: z.object({
      names: z.array(z.string()).describe("Object name(s) to export"),
      filepath: z.string().describe("Full output file path (e.g. /tmp/model.glb)"),
      file_format: z.string().optional().describe("Format: GLB, GLTF, FBX, OBJ, or STL (default GLB)"),
    }),
  }
)

const listInstalledAddons = tool(
  async () => executeMcpCommand("list_installed_addons"),
  {
    name: "list_installed_addons",
    description:
      "List all enabled Blender addons with metadata. Use this to discover what " +
      "additional capabilities are available (e.g. Node Wrangler, Rigify, LoopTools). " +
      "Call this early to adapt your approach based on installed addons.",
    schema: z.object({}),
  }
)

// ---------- Phase 5: Material Tools ---------

const createMaterial = tool(
  async ({ name, color, metallic, roughness }: { name: string; color?: number[]; metallic?: number; roughness?: number }) =>
    executeMcpCommand("create_material", { name, color, metallic, roughness }),
  {
    name: "create_material",
    description:
      "Create a new Principled BSDF material. Optionally set base color [R,G,B] (0-1), " +
      "metallic (0-1), and roughness (0-1). Returns the material name.",
    schema: z.object({
      name: z.string().describe("Material name"),
      color: z.array(z.number()).min(3).max(4).optional().describe("Base color [R,G,B] or [R,G,B,A] in 0-1 range"),
      metallic: z.number().min(0).max(1).optional().describe("Metallic value 0-1"),
      roughness: z.number().min(0).max(1).optional().describe("Roughness value 0-1"),
    }),
  }
)

const assignMaterial = tool(
  async ({ object_name, material_name, slot_index }: { object_name: string; material_name: string; slot_index?: number }) =>
    executeMcpCommand("assign_material", { object_name, material_name, slot_index }),
  {
    name: "assign_material",
    description:
      "Assign a material to a Blender object. By default replaces slot 0 so the material " +
      "is immediately visible. Use slot_index for a specific slot, or slot_index=-1 to append.",
    schema: z.object({
      object_name: z.string().describe("Target object name"),
      material_name: z.string().describe("Material name to assign"),
      slot_index: z.number().optional().describe("Slot index to replace (default: 0, use -1 to append)"),
    }),
  }
)

// ---------- Phase 5: Lighting Tools ---------

const addLight = tool(
  async ({ light_type, name, location, energy, color }: { light_type?: string; name?: string; location?: number[]; energy?: number; color?: number[] }) =>
    executeMcpCommand("add_light", { light_type, name, location, energy, color }),
  {
    name: "add_light",
    description:
      "Add a new light to the scene. Types: POINT, SUN, SPOT, AREA. " +
      "Set energy (watts), color [R,G,B] (0-1), and location [x,y,z].",
    schema: z.object({
      light_type: z.string().optional().describe("Light type: POINT (default), SUN, SPOT, AREA"),
      name: z.string().optional().describe("Custom name for the light"),
      location: z.array(z.number()).length(3).optional().describe("[x,y,z] world location"),
      energy: z.number().optional().describe("Light power in watts"),
      color: z.array(z.number()).length(3).optional().describe("[R,G,B] light color 0-1"),
    }),
  }
)

const setLightProperties = tool(
  async ({ name, energy, color, shadow_soft_size, spot_size, spot_blend, size }: { name: string; energy?: number; color?: number[]; shadow_soft_size?: number; spot_size?: number; spot_blend?: number; size?: number }) =>
    executeMcpCommand("set_light_properties", { name, energy, color, shadow_soft_size, spot_size, spot_blend, size }),
  {
    name: "set_light_properties",
    description:
      "Modify properties on an existing light. Set energy, color, shadow_soft_size. " +
      "For SPOT lights: spot_size (degrees), spot_blend. For AREA lights: size.",
    schema: z.object({
      name: z.string().describe("Light object name"),
      energy: z.number().optional().describe("Light power in watts"),
      color: z.array(z.number()).length(3).optional().describe("[R,G,B] 0-1"),
      shadow_soft_size: z.number().optional().describe("Shadow softness radius"),
      spot_size: z.number().optional().describe("Spot cone angle in degrees (SPOT only)"),
      spot_blend: z.number().optional().describe("Spot edge softness 0-1 (SPOT only)"),
      size: z.number().optional().describe("Area light size (AREA only)"),
    }),
  }
)

// ---------- Phase 5: Camera Tools ---------

const addCamera = tool(
  async ({ name, location, rotation, lens, sensor_width }: { name?: string; location?: number[]; rotation?: number[]; lens?: number; sensor_width?: number }) =>
    executeMcpCommand("add_camera", { name, location, rotation, lens, sensor_width }),
  {
    name: "add_camera",
    description:
      "Add a new camera to the scene with optional position, rotation (degrees), " +
      "focal length (mm), and sensor width.",
    schema: z.object({
      name: z.string().optional().describe("Camera name"),
      location: z.array(z.number()).length(3).optional().describe("[x,y,z] world location"),
      rotation: z.array(z.number()).length(3).optional().describe("[x,y,z] rotation in degrees"),
      lens: z.number().optional().describe("Focal length in mm (default 50)"),
      sensor_width: z.number().optional().describe("Sensor width in mm (default 36)"),
    }),
  }
)

const setCameraProperties = tool(
  async ({ name, lens, sensor_width, clip_start, clip_end, dof_use, dof_focus_distance, dof_aperture_fstop, set_active }: {
    name: string; lens?: number; sensor_width?: number; clip_start?: number; clip_end?: number;
    dof_use?: boolean; dof_focus_distance?: number; dof_aperture_fstop?: number; set_active?: boolean
  }) =>
    executeMcpCommand("set_camera_properties", { name, lens, sensor_width, clip_start, clip_end, dof_use, dof_focus_distance, dof_aperture_fstop, set_active }),
  {
    name: "set_camera_properties",
    description:
      "Modify properties on an existing camera. Set lens, sensor_width, clip range, " +
      "depth of field settings (dof_use, dof_focus_distance, dof_aperture_fstop), " +
      "and set_active=true to make it the scene camera.",
    schema: z.object({
      name: z.string().describe("Camera object name"),
      lens: z.number().optional().describe("Focal length in mm"),
      sensor_width: z.number().optional().describe("Sensor width in mm"),
      clip_start: z.number().optional().describe("Near clipping distance"),
      clip_end: z.number().optional().describe("Far clipping distance"),
      dof_use: z.boolean().optional().describe("Enable/disable depth of field"),
      dof_focus_distance: z.number().optional().describe("Focus distance in meters"),
      dof_aperture_fstop: z.number().optional().describe("F-stop value for DoF"),
      set_active: z.boolean().optional().describe("Set as the active scene camera"),
    }),
  }
)

// ---------- Phase 5: Render Tools ---------

const setRenderSettings = tool(
  async ({ engine, resolution_x, resolution_y, resolution_percentage, samples, use_denoising, film_transparent, output_path, file_format }: {
    engine?: string; resolution_x?: number; resolution_y?: number; resolution_percentage?: number;
    samples?: number; use_denoising?: boolean; film_transparent?: boolean; output_path?: string; file_format?: string
  }) =>
    executeMcpCommand("set_render_settings", { engine, resolution_x, resolution_y, resolution_percentage, samples, use_denoising, film_transparent, output_path, file_format }),
  {
    name: "set_render_settings",
    description:
      "Configure render settings: engine (EEVEE, CYCLES), resolution, samples, denoising, " +
      "film_transparent (for transparent backgrounds), output path and file format.",
    schema: z.object({
      engine: z.string().optional().describe("Render engine: EEVEE, CYCLES"),
      resolution_x: z.number().optional().describe("Horizontal resolution in pixels"),
      resolution_y: z.number().optional().describe("Vertical resolution in pixels"),
      resolution_percentage: z.number().optional().describe("Resolution scale percentage (default 100)"),
      samples: z.number().optional().describe("Render samples (higher = better quality)"),
      use_denoising: z.boolean().optional().describe("Enable denoising (Cycles only)"),
      film_transparent: z.boolean().optional().describe("Transparent background"),
      output_path: z.string().optional().describe("Output file path"),
      file_format: z.string().optional().describe("File format: PNG, JPEG, EXR, etc."),
    }),
  }
)

const renderImage = tool(
  async ({ output_path, file_format }: { output_path?: string; file_format?: string }) =>
    executeMcpCommand("render_image", { output_path, file_format }),
  {
    name: "render_image",
    description:
      "Render the current scene to an image file. Uses current render settings unless " +
      "output_path or file_format are provided to override.",
    schema: z.object({
      output_path: z.string().optional().describe("Output file path (overrides scene settings)"),
      file_format: z.string().optional().describe("File format: PNG, JPEG, EXR, etc. (overrides scene settings)"),
    }),
  }
)

// ---------- PolyHaven Tools ---------

const getPolyhavenCategories = tool(
  async ({ asset_type }: { asset_type: string }) =>
    executeMcpCommand("get_polyhaven_categories", { asset_type }),
  {
    name: "get_polyhaven_categories",
    description: "List available PolyHaven asset categories for a given type.",
    schema: z.object({
      asset_type: z.string().describe("Asset type: hdris, textures, models, or all"),
    }),
  }
)

const searchPolyhavenAssets = tool(
  async ({ asset_type, categories }: { asset_type?: string; categories?: string }) =>
    executeMcpCommand("search_polyhaven_assets", { asset_type, categories }),
  {
    name: "search_polyhaven_assets",
    description:
      "Search PolyHaven for textures, HDRIs, and 3D models. " +
      "Filter by asset_type (hdris, textures, models, all) and/or categories.",
    schema: z.object({
      asset_type: z.string().optional().describe("Asset type filter: hdris, textures, models, or all"),
      categories: z.string().optional().describe("Category filter string"),
    }),
  }
)

const downloadPolyhavenAsset = tool(
  async ({ asset_id, asset_type, resolution, file_format }: { asset_id: string; asset_type: string; resolution?: string; file_format?: string }) =>
    executeMcpCommand("download_polyhaven_asset", { asset_id, asset_type, resolution, file_format }),
  {
    name: "download_polyhaven_asset",
    description: "Download a PolyHaven asset by ID and import it into the scene.",
    schema: z.object({
      asset_id: z.string().describe("PolyHaven asset ID (slug)"),
      asset_type: z.string().describe("Asset type: hdris, textures, or models"),
      resolution: z.string().optional().describe("Resolution (default: 1k)"),
      file_format: z.string().optional().describe("File format (hdr/exr for HDRIs, jpg/png for textures, gltf/fbx for models)"),
    }),
  }
)

const setTexture = tool(
  async ({ object_name, texture_id }: { object_name: string; texture_id: string }) =>
    executeMcpCommand("set_texture", { object_name, texture_id }),
  {
    name: "set_texture",
    description:
      "Apply a previously downloaded PolyHaven texture to an object. " +
      "The texture must be downloaded first via download_polyhaven_asset.",
    schema: z.object({
      object_name: z.string().describe("Target Blender object name"),
      texture_id: z.string().describe("PolyHaven texture asset ID (the same ID used for download)"),
    }),
  }
)

// ---------- Sketchfab Tools ---------

const searchSketchfabModels = tool(
  async ({ query, downloadable }: { query: string; downloadable?: boolean }) =>
    executeMcpCommand("search_sketchfab_models", { query, downloadable }),
  {
    name: "search_sketchfab_models",
    description: "Search Sketchfab for 3D models.",
    schema: z.object({
      query: z.string().describe("Search query"),
      downloadable: z.boolean().optional().describe("Only show downloadable models"),
    }),
  }
)

const downloadSketchfabModel = tool(
  async ({ uid }: { uid: string }) => executeMcpCommand("download_sketchfab_model", { uid }),
  {
    name: "download_sketchfab_model",
    description: "Download a Sketchfab model by UID.",
    schema: z.object({
      uid: z.string().describe("Sketchfab model UID"),
    }),
  }
)

// ---------- Hyper3D / Neural Tools ---------

const getHyper3dStatus = tool(
  async () => executeMcpCommand("get_hyper3d_status"),
  {
    name: "get_hyper3d_status",
    description: "Check if Hyper3D neural generation is available.",
    schema: z.object({}),
  }
)

const createRodinJob = tool(
  async ({ text_prompt, images }: { text_prompt?: string; images?: string[] }) =>
    executeMcpCommand("create_rodin_job", { text_prompt, images }),
  {
    name: "create_rodin_job",
    description:
      "Create a Hyper3D Rodin neural 3D generation job. " +
      "Provide either a text prompt or reference images (not both).",
    schema: z.object({
      text_prompt: z.string().optional().describe("Text description of the 3D model to generate"),
      images: z.array(z.string()).optional().describe("Optional reference image URLs for image-to-3D"),
    }),
  }
)

const pollRodinJobStatus = tool(
  async ({ subscription_key }: { subscription_key: string }) =>
    executeMcpCommand("poll_rodin_job_status", { subscription_key }),
  {
    name: "poll_rodin_job_status",
    description: "Poll the status of a Rodin generation job using the subscription key from create_rodin_job.",
    schema: z.object({
      subscription_key: z.string().describe("Subscription key returned by create_rodin_job"),
    }),
  }
)

const importGeneratedAsset = tool(
  async ({ task_uuid, name }: { task_uuid: string; name: string }) =>
    executeMcpCommand("import_generated_asset", { task_uuid, name }),
  {
    name: "import_generated_asset",
    description:
      "Import a completed Hyper3D Rodin generated asset into the Blender scene. " +
      "Requires the task UUID from the generation job.",
    schema: z.object({
      task_uuid: z.string().describe("Task UUID from the Rodin generation job"),
      name: z.string().describe("Name to assign to the imported object in Blender"),
    }),
  }
)

// ============================================================================
// Tool Sets (filtered by config)
// ============================================================================

const SKETCHFAB_TOOL_NAMES = new Set(["search_sketchfab_models", "download_sketchfab_model"])
const POLYHAVEN_TOOL_NAMES = new Set([
  "get_polyhaven_categories",
  "search_polyhaven_assets",
  "download_polyhaven_asset",
  "set_texture",
])
const HYPER3D_TOOL_NAMES = new Set([
  "get_hyper3d_status",
  "create_rodin_job",
  "poll_rodin_job_status",
  "import_generated_asset",
])

const ALL_TOOLS = [
  executeCode,
  getSceneInfo,
  getAllObjectInfo,
  getObjectInfo,
  getViewportScreenshotTool,
  listMaterials,
  deleteObject,
  setObjectTransform,
  renameObject,
  duplicateObject,
  joinObjects,
  addModifier,
  applyModifier,
  applyTransforms,
  shadeSmooth,
  parentSet,
  parentClear,
  setOrigin,
  moveToCollection,
  setVisibility,
  exportObject,
  listInstalledAddons,
  createMaterial,
  assignMaterial,
  addLight,
  setLightProperties,
  addCamera,
  setCameraProperties,
  setRenderSettings,
  renderImage,
  getPolyhavenCategories,
  searchPolyhavenAssets,
  downloadPolyhavenAsset,
  setTexture,
  searchSketchfabModels,
  downloadSketchfabModel,
  getHyper3dStatus,
  createRodinJob,
  pollRodinJobStatus,
  importGeneratedAsset,
]

// ── Bind domain guides to tool descriptions ──
// Each tool whose name appears in TOOL_GUIDE_MAP gets the full guide
// appended to its description. This happens once at module load time.
for (const t of ALL_TOOLS) {
  const guide = TOOL_GUIDE_MAP[t.name]
  if (guide) {
    t.description = withGuide(t.name, t.description)
  }
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Viewport Screenshot Middleware
 *
 * Auto-captures a screenshot after every `execute_code` call and logs it
 * as a vision event. Replaces the manual hack in the old executor.ts.
 */
/**
 * Dedup Middleware — prevents the agent from calling the same tool
 * with identical arguments redundantly. Handles TWO scenarios:
 *
 * 1. Sequential duplicates: same tool+args after a previous success → cached result
 * 2. Parallel duplicates: same tool+args sent simultaneously by LLM → coalesced
 *
 * If the previous/in-flight call failed, retries are allowed.
 */
function createDedupMiddleware() {
  // Stable hash: sort keys so {a:1,b:2} and {b:2,a:1} produce the same string
  function stableHash(args: Record<string, unknown>): string {
    return JSON.stringify(args, Object.keys(args).sort())
  }

  // Cache of last successful result per tool+args combo
  // Key = "toolName:stableHash(args)"
  const lastCalls = new Map<string, { result: unknown; failed: boolean }>()
  // In-flight calls: key = "toolName:argsHash" → promise of result
  const inFlight = new Map<string, Promise<unknown>>()

  return createMiddleware({
    name: "DedupMiddleware",
    wrapToolCall: async (request, handler) => {
      const toolName = request.toolCall.name
      const argsHash = stableHash((request.toolCall.args as Record<string, unknown>) ?? {})
      const flightKey = `${toolName}:${argsHash}`

      // Check 1: Sequential duplicate — same tool+args already succeeded
      const lastCall = lastCalls.get(flightKey)
      if (lastCall && !lastCall.failed) {
        console.log(`[Dedup] Skipping duplicate: ${toolName} (identical args, previous call succeeded)`)
        const { ToolMessage: TM } = await import("@langchain/core/messages")
        return new TM({
          content: JSON.stringify({
            _skipped_duplicate: true,
            _message: `${toolName} already executed successfully with these exact parameters. No action needed.`,
          }),
          tool_call_id: request.toolCall.id ?? "unknown",
        })
      }

      // Check 2: Parallel duplicate — same call already in-flight
      if (inFlight.has(flightKey)) {
        console.log(`[Dedup] Coalescing parallel call: ${toolName} (waiting for in-flight result)`)
        const existingResult = await inFlight.get(flightKey)
        const { ToolMessage: TM } = await import("@langchain/core/messages")
        return new TM({
          content: JSON.stringify({
            _skipped_duplicate: true,
            _message: `${toolName} was already executing with these parameters. Returning the result.`,
          }),
          tool_call_id: request.toolCall.id ?? "unknown",
        })
      }

      // Execute the tool, tracking it as in-flight
      let resolveInFlight: (v: unknown) => void
      const flightPromise = new Promise((resolve) => { resolveInFlight = resolve })
      inFlight.set(flightKey, flightPromise)

      let result: Awaited<ReturnType<typeof handler>>
      let failed = false
      try {
        result = await handler(request)
        const content = typeof result === "object" && "content" in result ? String(result.content) : ""
        failed = content.includes('"error"')
      } catch (error) {
        failed = true
        throw error
      } finally {
        // Cache result and clear in-flight
        lastCalls.set(flightKey, { result: result!, failed })
        resolveInFlight!(result!)
        inFlight.delete(flightKey)
      }

      return result
    },
  })
}

function createViewportMiddleware(onStreamEvent?: (event: AgentStreamEvent) => void) {
  return createMiddleware({
    name: "ViewportScreenshotMiddleware",
    wrapToolCall: async (request, handler) => {
      let result: Awaited<ReturnType<typeof handler>>
      try {
        result = await handler(request)
      } catch (toolError) {
        // Prevent framework crash — return error as ToolMessage
        console.error(`[ViewportMiddleware] Tool execution error for ${request.toolCall.name}:`, toolError)
        const { ToolMessage: TM } = await import("@langchain/core/messages")
        return new TM({
          content: `Tool error: ${toolError instanceof Error ? toolError.message : String(toolError)}`,
          tool_call_id: request.toolCall.id ?? "unknown",
        })
      }

      // After execute_code, auto-capture viewport
      if (request.toolCall.name === "execute_code") {
        try {
          const screenshot = await getViewportScreenshot()
          const event: AgentStreamEvent = {
            type: "agent:vision",
            timestamp: new Date().toISOString(),
            assessment: `Viewport captured: ${screenshot.width}x${screenshot.height}`,
            issues: [],
          }
          onStreamEvent?.(event)
        } catch (error) {
          const event: AgentStreamEvent = {
            type: "agent:vision",
            timestamp: new Date().toISOString(),
            assessment: `WARNING: Viewport capture failed — ${error instanceof Error ? error.message : String(error)}`,
            issues: ["screenshot_failed"],
          }
          onStreamEvent?.(event)
        }
      }

      return result
    },
  })
}

/**
 * RAG Context Middleware
 *
 * Before each model call, searches for relevant scripts and injects them
 * into the conversation context. This is the CRAG pipeline integration.
 */
function createRAGMiddleware() {
  return createMiddleware({
    name: "RAGContextMiddleware",
    wrapModelCall: async (request, handler) => {
      // Debug breadcrumb: is this middleware being called at all?
      const messages = request.messages ?? []
      const msgTypes = messages.map((m) => {
        const mRec = m as unknown as Record<string, unknown>
        if (typeof mRec._getType === "function") {
          try { return (mRec._getType as () => string).call(m) } catch { return "unknown" }
        }
        return (mRec.role as string) ?? "no-type"
      })
      console.log(`[RAG] wrapModelCall invoked — ${messages.length} messages, types: [${msgTypes.join(", ")}]`)

      // Extract the latest user message to use as search query
      const lastUserMsg = [...messages]
        .reverse()
        .find((m) => isHumanMessage(m))

      if (!lastUserMsg) {
        console.log(`[RAG] No human message found — skipping RAG`)
      }

      if (lastUserMsg) {
        const msg = lastUserMsg as unknown as Record<string, unknown>
        const rawUserContent = msg.content
        const content = typeof rawUserContent === "string"
          ? rawUserContent
          : Array.isArray(rawUserContent)
            ? (rawUserContent as Array<{ text?: string }>).map((c) => c.text ?? "").join("")
            : ""

        if (content) {
          try {
            console.log(`[RAG] Searching for context: "${content.slice(0, 80)}..."`)

            // Wrap similarity search with 10s timeout to prevent hanging on stale Prisma connections
            const searchPromise = similaritySearch(content, { limit: 3 })
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("RAG search timed out after 10s")), 10_000)
            )
            const results = await Promise.race([searchPromise, timeoutPromise])

            console.log(`[RAG] Found ${results.length} results:`, results.map(r => `${r.source}(${r.similarity.toFixed(3)})`).join(", "))

            if (results.length > 0) {
              const context = formatContextFromSources(results)
              const ragBlock = `\n<rag_context>\nRelevant Blender script references:\n${context}\n</rag_context>`

              // Append RAG context to the existing system message instead of
              // prepending a new SystemMessage — LangGraph requires the system
              // message to be first and only one.
              const updatedMessages = messages.map((m, idx) => {
                const mRec = m as unknown as Record<string, unknown>
                // Call _getType BOUND to message — unbound call crashes (this.type → undefined)
                const msgType = typeof mRec._getType === "function"
                  ? (mRec._getType as () => string).call(m)
                  : undefined
                const isSystem = msgType === "system" || mRec.role === "system"
                if (idx === 0 && isSystem) {
                  const rawContent = (m as unknown as Record<string, unknown>).content
                  const original = typeof rawContent === "string"
                    ? rawContent
                    : Array.isArray(rawContent)
                      ? (rawContent as Array<{ text?: string }>).map((c) => c.text ?? "").join("")
                      : ""
                  console.log(`[RAG] Injecting ${context.length} chars of context into system message (original: ${original.length} chars)`)
                  return new SystemMessage(original + ragBlock)
                }
                return m
              })

              return handler({
                ...request,
                messages: updatedMessages,
              })
            }
          } catch (err) {
            console.warn(`[RAG] Non-fatal error:`, err instanceof Error ? err.message : err)
            if (err instanceof Error && err.stack) {
              console.warn(`[RAG] Stack:`, err.stack.split("\n").slice(0, 5).join("\n"))
            }
            // RAG failure is non-fatal — continue without context
          }
        }
      }

      return handler(request)
    },
  })
}

// ============================================================================
// Agent Factory
// ============================================================================

export interface BlenderAgentV2Options {
  /** Allow PolyHaven assets */
  allowPolyHaven?: boolean
  /** Allow Sketchfab assets */
  allowSketchfab?: boolean
  /** Allow Hyper3D neural generation */
  allowHyper3d?: boolean
  /** Use RAG for context enrichment */
  useRAG?: boolean
  /** Enable dynamic addon detection — detects installed addons and adapts system prompt */
  enableAddonDetection?: boolean
  /** Pre-fetched addon modules for prompt injection (skips runtime detection) */
  detectedAddonModules?: string[]
  /** Callback for streaming agent events to UI */
  onStreamEvent?: (event: AgentStreamEvent) => void
}

// NOTE: MemorySaver is now created per-agent invocation to prevent
// cross-invocation state corruption (especially across hot-reloads).

/**
 * Create a new LangChain v1 Blender agent.
 *
 * Usage:
 *   const agent = createBlenderAgentV2(options)
 *   const result = await agent.invoke(
 *     { messages: [{ role: "user", content: "Create a cube" }] },
 *     { configurable: { thread_id: projectId } }
 *   )
 */
export function createBlenderAgentV2(options: BlenderAgentV2Options = {}) {
  const {
    allowPolyHaven = true,
    allowSketchfab = false,
    allowHyper3d = false,
    useRAG = true,
    enableAddonDetection = true,
    detectedAddonModules,
    onStreamEvent,
  } = options

  // Filter tools based on config
  const tools = ALL_TOOLS.filter((t) => {
    if (!allowSketchfab && SKETCHFAB_TOOL_NAMES.has(t.name)) return false
    if (!allowPolyHaven && POLYHAVEN_TOOL_NAMES.has(t.name)) return false
    if (!allowHyper3d && HYPER3D_TOOL_NAMES.has(t.name)) return false
    return true
  })

  // Build dynamic system prompt with addon detection
  let dynamicPrompt = SYSTEM_PROMPT
  if (enableAddonDetection && detectedAddonModules) {
    const { promptBlock } = getAddonPromptHints(detectedAddonModules)
    if (promptBlock) {
      dynamicPrompt = SYSTEM_PROMPT + "\n" + promptBlock
    }
  }

  // Build middleware stack (dedup runs first to catch duplicates before side effects)
  const middleware = [
    createDedupMiddleware(),
    createViewportMiddleware(onStreamEvent),
  ]

  if (useRAG) {
    middleware.push(createRAGMiddleware())
  }

  // Create the LangChain v1 agent
  const model = createGeminiModel({ temperature: 0.4 })

  const agent = createAgent({
    model,
    tools,
    systemPrompt: dynamicPrompt,
    middleware,
    checkpointer: new MemorySaver(),
  })

  return agent
}

// ============================================================================
// Convenience re-exports
// ============================================================================

export type { AgentStreamEvent }
