import fs from "fs"
import path from "path"
import net from "net"
import { randomUUID } from "crypto"

const HOST = process.env.BLENDER_MCP_HOST ?? "127.0.0.1"
const PORT = Number(process.env.BLENDER_MCP_PORT ?? 9876)
const TIMEOUT = Number(process.env.BLENDER_MCP_TIMEOUT_MS ?? 120_000)

type McpResponse = {
  status: string
  result?: unknown
  message?: string
  raw?: string
}

function parseArgs(argv: string[]) {
  const args = [...argv]
  const scriptPath = args.shift()
  if (!scriptPath) {
    throw new Error("Usage: npx tsx scripts/test/run-blender-script.ts <script.py> [--screenshot path] [--render path]")
  }

  let screenshotPath: string | undefined
  let renderPath: string | undefined

  while (args.length > 0) {
    const flag = args.shift()
    const value = args.shift()
    if (!flag || !value) {
      throw new Error("Invalid CLI arguments")
    }

    if (flag === "--screenshot") {
      screenshotPath = value
      continue
    }

    if (flag === "--render") {
      renderPath = value
      continue
    }

    throw new Error(`Unknown flag: ${flag}`)
  }

  return {
    scriptPath: path.resolve(scriptPath),
    screenshotPath: screenshotPath ? path.resolve(screenshotPath) : undefined,
    renderPath: renderPath ? path.resolve(renderPath) : undefined,
  }
}

async function mcpCall(type: string, params: Record<string, unknown> = {}): Promise<McpResponse> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: HOST, port: PORT }, () => {
      const payload = JSON.stringify({ id: randomUUID(), type, params })
      const chunks: Buffer[] = []

      socket.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
        const raw = Buffer.concat(chunks).toString("utf8")
        if (raw.trim().endsWith("}")) {
          socket.end()
          try {
            resolve(JSON.parse(raw))
          } catch {
            resolve({ status: "error", message: "Failed to parse Blender MCP response", raw })
          }
        }
      })

      socket.write(`${payload}\n`)
    })

    socket.setTimeout(TIMEOUT, () => {
      socket.destroy()
      reject(new Error("Blender MCP command timed out"))
    })

    socket.once("error", (error) => reject(error))
  })
}

function printResponse(label: string, response: McpResponse) {
  const prefix = response.status === "success" ? "✓" : "✗"
  console.log(`${prefix} ${label}`)
  if (response.status === "error") {
    console.log(response.message ?? response.raw ?? "Unknown Blender MCP error")
  } else if (response.result !== undefined) {
    const output = JSON.stringify(response.result)
    console.log(output.length > 400 ? `${output.slice(0, 400)}…` : output)
  }
}

async function main() {
  const { scriptPath, screenshotPath, renderPath } = parseArgs(process.argv.slice(2))
  const code = fs.readFileSync(scriptPath, "utf8")

  console.log(`Running ${scriptPath}`)
  const executeResponse = await mcpCall("execute_code", { code })
  printResponse("execute_code", executeResponse)
  if (executeResponse.status === "error") {
    process.exit(1)
  }

  if (screenshotPath) {
    const screenshotResponse = await mcpCall("get_viewport_screenshot", { filepath: screenshotPath })
    printResponse("get_viewport_screenshot", screenshotResponse)
    if (screenshotResponse.status === "error") {
      process.exit(1)
    }
  }

  if (renderPath) {
    const renderResponse = await mcpCall("render_image", { output_path: renderPath, file_format: "PNG" })
    printResponse("render_image", renderResponse)
    if (renderResponse.status === "error") {
      process.exit(1)
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
