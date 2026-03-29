import { ToolCategory, ToolMetadata } from "./types"

export const TOOL_REGISTRY: ToolMetadata[] = [
  {
    name: "get_scene_info",
    description:
      "Summarize the current Blender scene, including object names, counts, and basic transform data. Call this at the start of every plan to capture state.",
    category: "inspection",
    parameters: "(no parameters)",
  },
  {
    name: "get_object_info",
    description:
      "Inspect a specific object by name to retrieve type, transforms, materials, and bounding boxes. Use before modifying or reusing existing geometry.",
    category: "inspection",
    parameters: "name: string (object name)",
  },
  {
    name: "get_all_object_info",
    description:
      "Retrieve detailed info for every object in the scene at once: transforms, materials, modifiers, mesh stats, light/camera data. Use instead of multiple get_object_info calls when you need the full picture.",
    category: "inspection",
    parameters: "max_objects?: number (default 50), start_index?: number (default 0)",
  },
  {
    name: "get_viewport_screenshot",
    description:
      "Capture the active viewport for visual confirmation. Useful when the user requests a preview or validation of results.",
    category: "inspection",
    parameters: "max_size?: number (default 800), format?: string ('png'|'jpeg')",
  },
  {
    name: "execute_code",
    description:
      "Run custom Blender Python code to create or modify geometry, materials, lighting, or camera settings. Scripts should be concise and idempotent.",
    category: "advanced",
    parameters: "description: string (human-readable description of what the code should do — NOT actual Python code)",
  },
  {
    name: "get_local_asset_library_status",
    description:
      "Check whether the local curated ViperMesh asset catalog is configured inside Blender and ready for search/import.",
    category: "assets",
    parameters: "(no parameters)",
  },
  {
    name: "search_local_assets",
    description:
      "Search the local curated asset catalog for reusable models such as furniture, props, foliage, or decor.",
    category: "assets",
    parameters: "query?: string, category?: string, tags?: string (comma-separated), style?: string, limit?: number (default 10)",
  },
  {
    name: "import_local_asset",
    description:
      "Append or link an asset from the local curated catalog into the Blender scene using its asset ID.",
    category: "assets",
    parameters: "asset_id: string, link?: boolean (default false)",
  },
  {
    name: "get_polyhaven_status",
    description:
      "Check whether PolyHaven integration is configured inside Blender and ready for asset downloads.",
    category: "assets",
    parameters: "(no parameters)",
  },
  {
    name: "get_polyhaven_categories",
    description:
      "List available categories for a PolyHaven asset type. Call before search_polyhaven_assets to discover valid category filters.",
    category: "assets",
    parameters: "asset_type: string ('hdris'|'textures'|'models'|'all')",
  },
  {
    name: "search_polyhaven_assets",
    description:
      "Search the PolyHaven catalog for HDRIs, textures, or models using optional type and category filters.",
    category: "assets",
    parameters: "asset_type?: string ('hdris'|'textures'|'models'|'all'), categories?: string (comma-separated category names)",
  },
  {
    name: "download_polyhaven_asset",
    description:
      "Download a PolyHaven asset by ID and import it into the Blender scene. Requires the status check to have succeeded.",
    category: "assets",
    parameters: "asset_id: string, asset_type: string ('hdris'|'textures'|'models'), resolution?: string (default '1k'), file_format?: string",
  },
  {
    name: "set_texture",
    description:
      "Apply a previously downloaded PolyHaven texture to a mesh object, creating material slots when needed.",
    category: "materials",
    parameters: "object_name: string, texture_id: string",
  },
  {
    name: "get_hyper3d_status",
    description:
      "Verify Hyper3D Rodin integration (mode and API keys) before attempting to generate assets.",
    category: "assets",
    parameters: "(no parameters)",
  },
  {
    name: "create_rodin_job",
    description:
      "Submit a Hyper3D Rodin generation job using text prompts or images. Returns identifiers for polling.",
    category: "assets",
    parameters: "text_prompt?: string (text description for generation), images?: array (image data), bbox_condition?: object",
  },
  {
    name: "poll_rodin_job_status",
    description:
      "Check the progress of a previously created Hyper3D job to determine whether assets are ready for import.",
    category: "assets",
    parameters: "subscription_key: string (or request_id depending on mode)",
  },
  {
    name: "import_generated_asset",
    description:
      "Download and import a generated Hyper3D asset into the scene, cleaning up temporary geometry.",
    category: "assets",
    parameters: "task_uuid: string (or request_id), name: string",
  },
  {
    name: "get_sketchfab_status",
    description:
      "Verify Sketchfab integration and credentials before searching the catalog.",
    category: "assets",
    parameters: "(no parameters)",
  },
  {
    name: "search_sketchfab_models",
    description:
      "Search Sketchfab for models that match user-provided keywords.",
    category: "assets",
    parameters: "query: string, categories?: string, count?: number (default 20), downloadable?: boolean (default true)",
  },
  {
    name: "download_sketchfab_model",
    description:
      "Download and import a Sketchfab model. Ensure usage rights are respected.",
    category: "assets",
    parameters: "uid: string",
  },
]

export function getToolMetadata(name: string): ToolMetadata | undefined {
  return TOOL_REGISTRY.find((tool) => tool.name === name)
}

export function toolsByCategory(category: ToolCategory): ToolMetadata[] {
  return TOOL_REGISTRY.filter((tool) => tool.category === category)
}
