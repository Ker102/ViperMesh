/**
 * MCP Tool Verification Script
 * 
 * Tests all 14 Blender MCP tools directly against the running addon.
 * No UI or dev server needed — just Blender with MCP addon running.
 * 
 * Usage: npx tsx scripts/test-mcp-tools.ts
 */

import net from "net"
import { randomUUID } from "crypto"

const HOST = process.env.BLENDER_MCP_HOST ?? "127.0.0.1"
const PORT = Number(process.env.BLENDER_MCP_PORT ?? 9876)
const TIMEOUT = 30_000

// ── Colors ──────────────────────────────────────────────────────────────
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

// ── MCP Client ──────────────────────────────────────────────────────────
async function mcpCall(type: string, params: Record<string, unknown> = {}): Promise<{
  status: string
  result?: unknown
  message?: string
  raw?: string
}> {
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
            resolve({ status: "error", message: "Failed to parse response", raw })
          }
        }
      })

      socket.write(`${payload}\n`)
    })

    socket.setTimeout(TIMEOUT, () => {
      socket.destroy()
      reject(new Error("Timed out"))
    })

    socket.once("error", (err) => reject(err))
  })
}

// ── Test runner ─────────────────────────────────────────────────────────
interface TestResult {
  name: string
  tool: string
  passed: boolean
  duration: number
  detail: string
}

const results: TestResult[] = []

async function test(
  name: string,
  tool: string,
  params: Record<string, unknown> = {},
  validate?: (resp: Record<string, unknown>) => string | null
): Promise<boolean> {
  const label = `${cyan(tool)} — ${name}`
  const start = performance.now()

  try {
    const resp = await mcpCall(tool, params)
    const duration = Math.round(performance.now() - start)

    if (resp.status === "error") {
      const msg = typeof resp.message === "string" ? resp.message : JSON.stringify(resp)
      console.log(`  ${red("✗")} ${label} ${dim(`(${duration}ms)`)}`)
      console.log(`    ${red(msg)}`)
      results.push({ name, tool, passed: false, duration, detail: msg })
      return false
    }

    // Custom validation
    if (validate) {
      const err = validate(resp as Record<string, unknown>)
      if (err) {
        console.log(`  ${red("✗")} ${label} ${dim(`(${duration}ms)`)}`)
        console.log(`    ${red(err)}`)
        results.push({ name, tool, passed: false, duration, detail: err })
        return false
      }
    }

    // Truncate result for display
    const resultStr = JSON.stringify(resp.result ?? resp).slice(0, 200)
    console.log(`  ${green("✓")} ${label} ${dim(`(${duration}ms)`)}`)
    console.log(`    ${dim(resultStr)}`)
    results.push({ name, tool, passed: true, duration, detail: resultStr })
    return true
  } catch (err) {
    const duration = Math.round(performance.now() - start)
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`  ${red("✗")} ${label} ${dim(`(${duration}ms)`)}`)
    console.log(`    ${red(msg)}`)
    results.push({ name, tool, passed: false, duration, detail: msg })
    return false
  }
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log()
  console.log(bold("═══════════════════════════════════════════════"))
  console.log(bold("  ModelForge MCP Tool Verification"))
  console.log(bold(`  Target: ${HOST}:${PORT}`))
  console.log(bold("═══════════════════════════════════════════════"))
  console.log()

  // ── Phase 1: Core Tools ───────────────────────────────────────────
  console.log(yellow("▸ Phase 1: Core Tools"))

  await test("Get scene info", "get_scene_info", {}, (resp) => {
    const result = resp.result as Record<string, unknown> | undefined
    if (!result) return "No result returned"
    return null
  })

  await test("Get all objects", "get_all_object_info")

  await test("Execute code — create cube", "execute_code", {
    code: `
import bpy
# Clear default objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
# Create a red cube
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 1))
cube = bpy.context.active_object
cube.name = "TestCube"
mat = bpy.data.materials.new("RedMaterial")
mat.diffuse_color = (1, 0, 0, 1)
cube.data.materials.append(mat)
print("Created TestCube with red material")
`
  }, (resp) => {
    const result = resp.result as Record<string, unknown> | undefined
    if (result?.error) return `Script error: ${result.error}`
    return null
  })

  await test("Get object info — TestCube", "get_object_info", {
    name: "TestCube"
  }, (resp) => {
    const result = resp.result as Record<string, unknown> | undefined
    if (!result) return "No result returned"
    return null
  })

  await test("Get viewport screenshot", "get_viewport_screenshot", {
    filepath: `${process.env.TEMP ?? "/tmp"}/mf_test_screenshot_${Date.now()}.png`
  })

  // ── Phase 2: PolyHaven Tools ──────────────────────────────────────
  console.log()
  console.log(yellow("▸ Phase 2: Asset Tools"))

  await test("Get local asset library status", "get_local_asset_library_status")

  await test("Get PolyHaven categories", "get_polyhaven_categories", {
    asset_type: "textures"
  })

  await test("Search PolyHaven — wood", "search_polyhaven_assets", {
    asset_type: "textures",
    categories: "wood"
  })

  await test("Get PolyHaven status", "get_polyhaven_status")

  // ── Phase 3: Sketchfab Tools ──────────────────────────────────────
  console.log()
  console.log(yellow("▸ Phase 3: Sketchfab Tools"))

  await test("Get Sketchfab status", "get_sketchfab_status")

  await test("Search Sketchfab — sword", "search_sketchfab_models", {
    query: "medieval sword",
    downloadable: true
  })

  // ── Phase 4: Hyper3D / Neural Tools ───────────────────────────────
  console.log()
  console.log(yellow("▸ Phase 4: Hyper3D / Neural Tools"))

  await test("Get Hyper3D status", "get_hyper3d_status")

  // ── Phase 5: More execute_code tests ──────────────────────────────
  console.log()
  console.log(yellow("▸ Phase 5: Complex Code Execution"))

  await test("Execute code — add material + UV", "execute_code", {
    code: `
import bpy
obj = bpy.data.objects.get("TestCube")
if obj:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.uv.smart_project()
    bpy.ops.object.mode_set(mode='OBJECT')
    print(f"UV unwrapped {obj.name}")
else:
    print("TestCube not found")
`
  })

  await test("Execute code — add spotlight", "execute_code", {
    code: `
import bpy
bpy.ops.object.light_add(type='SPOT', location=(3, -3, 5))
light = bpy.context.active_object
light.name = "TestSpot"
light.data.energy = 500
light.data.spot_size = 0.8
print(f"Added spotlight: {light.name}")
`
  })

  await test("Final scene verification", "get_scene_info", {}, (resp) => {
    const result = resp.result as Record<string, unknown> | undefined
    if (!result) return "No result"
    const resultStr = JSON.stringify(result)
    // Check our objects exist
    if (!resultStr.includes("TestCube")) return "TestCube missing from scene!"
    if (!resultStr.includes("TestSpot")) return "TestSpot missing from scene!"
    return null
  })

  // ── Summary ───────────────────────────────────────────────────────
  console.log()
  console.log(bold("═══════════════════════════════════════════════"))
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0)

  if (failed === 0) {
    console.log(green(bold(`  ✓ ALL ${total} TESTS PASSED`)) + dim(` (${totalTime}ms total)`))
  } else {
    console.log(red(bold(`  ${failed}/${total} TESTS FAILED`)) + dim(` (${totalTime}ms total)`))
    console.log()
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  ${red("✗")} ${r.tool}: ${r.detail}`)
    }
  }
  console.log(bold("═══════════════════════════════════════════════"))
  console.log()

  // Exit with error code if any failed
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(red(`\nFatal error: ${err.message}`))
  process.exit(1)
})
