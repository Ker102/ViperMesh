import { McpClientConfig } from "./types"

const DEFAULT_HOST = "127.0.0.1"
const DEFAULT_PORT = 9876
const DEFAULT_TIMEOUT = 120_000

let cachedConfig: McpClientConfig | null = null

function parsePort(value: string | undefined) {
  if (!value) return DEFAULT_PORT
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 65_535) {
    throw new Error(`Invalid BLENDER_MCP_PORT value: ${value}`)
  }
  return parsed
}

export function getMcpConfig(): McpClientConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const host = process.env.BLENDER_MCP_HOST?.trim() || DEFAULT_HOST
  const port = parsePort(process.env.BLENDER_MCP_PORT)
  const timeoutRaw = process.env.BLENDER_MCP_TIMEOUT_MS
  const timeoutMs =
    timeoutRaw && !Number.isNaN(Number(timeoutRaw))
      ? Math.max(1_000, Number(timeoutRaw))
      : DEFAULT_TIMEOUT

  cachedConfig = {
    host,
    port,
    timeoutMs,
  }

  return cachedConfig
}

export function resetMcpConfigCache() {
  cachedConfig = null
}
