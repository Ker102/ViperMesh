export type McpCommandType =
  | "execute_code"
  | "get_scene_info"
  | "get_object_info"
  | "get_viewport_screenshot"
  | "get_local_asset_library_status"
  | "search_local_assets"
  | "import_local_asset"
  | "get_polyhaven_categories"
  | "search_polyhaven_assets"
  | "download_polyhaven_asset"
  | "set_texture"
  | "create_rodin_job"
  | "poll_rodin_job_status"
  | "import_generated_asset"
  | "search_sketchfab_models"
  | "download_sketchfab_model"
  | string

export interface McpCommand {
  id?: string
  type: McpCommandType
  params?: Record<string, unknown>
}

export interface McpResponse<T = unknown> {
  status?: "ok" | "success" | "error"
  result?: T
  message?: string
  raw?: unknown
}

export interface McpClientConfig {
  host: string
  port: number
  timeoutMs: number
}

/**
 * Response from get_viewport_screenshot MCP command.
 * Contains base64-encoded image data from Blender's viewport.
 */
export interface ViewportScreenshotResponse {
  /** Base64-encoded image data */
  image: string
  /** Image width in pixels */
  width: number
  /** Image height in pixels */
  height: number
  /** Image format */
  format: "png" | "jpeg"
  /** ISO timestamp when screenshot was captured */
  timestamp: string
}
