/**
 * LangSmith Debug Utility
 *
 * Fetches recent agent traces from LangSmith for debugging.
 * Usage:
 *   npx tsx scripts/debug-langsmith.ts                     # Last 5 runs
 *   npx tsx scripts/debug-langsmith.ts --limit 10          # Last 10 runs
 *   npx tsx scripts/debug-langsmith.ts --errors            # Only failed runs
 *   npx tsx scripts/debug-langsmith.ts --run <run-id>      # Drill into a specific run
 *   npx tsx scripts/debug-langsmith.ts --tools             # Show tool call details
 */

import "dotenv/config"
import { Client } from "langsmith"

// ── Helpers ──────────────────────────────────────────────────────────────

function truncate(str: string | undefined | null, max = 200): string {
  if (!str) return "(empty)"
  return str.length > max ? str.slice(0, max) + "…" : str
}

function formatDuration(start?: string | Date, end?: string | Date): string {
  if (!start || !end) return "—"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

type RunRecord = {
  id: string
  name: string
  run_type: string
  status: string
  inputs: Record<string, unknown>
  outputs: Record<string, unknown> | null
  error: string | null
  start_time: string | Date
  end_time?: string | Date
  total_tokens?: number
  prompt_tokens?: number
  completion_tokens?: number
  child_run_ids?: string[]
  tags?: string[]
  extra?: Record<string, unknown>
}

// ── CLI ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const projectName = process.env.LANGSMITH_PROJECT ?? "modelforge"

const flagLimit = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1] ?? "5", 10)
  : 5
const flagErrors = args.includes("--errors")
const flagTools = args.includes("--tools")
const flagRunId = args.includes("--run")
  ? args[args.indexOf("--run") + 1]
  : undefined

async function main() {
  const client = new Client()

  console.log(`\n🔍 LangSmith Debug — project: "${projectName}"`)
  console.log("─".repeat(60))

  // ── Drill into a specific run ─────────────────────────────────────

  if (flagRunId) {
    console.log(`\n📌 Fetching run: ${flagRunId}\n`)

    try {
      const run = (await client.readRun(flagRunId)) as unknown as RunRecord
      printRunDetail(run)

      // Fetch children
      console.log("\n📦 Child runs:")
      const children: RunRecord[] = []
      for await (const child of client.listRuns({
        projectName,
        parentRunId: flagRunId,
      })) {
        children.push(child as unknown as RunRecord)
      }

      if (children.length === 0) {
        console.log("  (no child runs)")
      } else {
        for (const child of children) {
          const duration = formatDuration(child.start_time, child.end_time)
          const status = child.error ? "❌" : "✅"
          const tokens = child.total_tokens ? ` [${child.total_tokens} tok]` : ""
          console.log(
            `  ${status} ${child.run_type.padEnd(6)} │ ${child.name}  (${duration})${tokens}`
          )
          if (child.error) {
            console.log(`     └─ Error: ${truncate(child.error, 150)}`)
          }
          if (flagTools && child.run_type === "tool") {
            console.log(`     └─ Input:  ${truncate(JSON.stringify(child.inputs), 150)}`)
            console.log(`     └─ Output: ${truncate(JSON.stringify(child.outputs), 150)}`)
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch run: ${err}`)
    }

    return
  }

  // ── List recent runs ──────────────────────────────────────────────

  console.log(
    `\n📋 Recent ${flagErrors ? "FAILED " : ""}runs (limit: ${flagLimit}):\n`
  )

  const runs: RunRecord[] = []
  for await (const run of client.listRuns({
    projectName,
    isRoot: true,
    error: flagErrors ? true : undefined,
    limit: flagLimit,
  })) {
    runs.push(run as unknown as RunRecord)
  }

  if (runs.length === 0) {
    console.log("  No runs found.")
    return
  }

  for (const run of runs) {
    printRunSummary(run)

    // If --tools flag, fetch and show tool calls
    if (flagTools) {
      const toolRuns: RunRecord[] = []
      for await (const child of client.listRuns({
        projectName,
        parentRunId: run.id,
        runType: "tool",
      })) {
        toolRuns.push(child as unknown as RunRecord)
      }

      if (toolRuns.length > 0) {
        for (const tool of toolRuns) {
          const status = tool.error ? "❌" : "✅"
          console.log(`    ${status} ${tool.name}`)
          if (tool.error) {
            console.log(`       └─ ${truncate(tool.error, 120)}`)
          }
        }
      }
    }

    console.log()
  }

  // ── Summary Stats ─────────────────────────────────────────────────

  const failed = runs.filter((r) => r.error)
  const totalTokens = runs.reduce((sum, r) => sum + (r.total_tokens ?? 0), 0)

  console.log("─".repeat(60))
  console.log(
    `📊 ${runs.length} runs | ${failed.length} failed | ${totalTokens.toLocaleString()} total tokens`
  )
  console.log()
}

function printRunSummary(run: RunRecord) {
  const status = run.error ? "❌ FAIL" : "✅ OK  "
  const duration = formatDuration(run.start_time, run.end_time)
  const tokens = run.total_tokens ? `${run.total_tokens} tok` : "—"
  const time = new Date(run.start_time).toLocaleString()

  console.log(`  ${status} │ ${run.name}`)
  console.log(`         │ ID: ${run.id}`)
  console.log(`         │ Time: ${time}  Duration: ${duration}  Tokens: ${tokens}`)

  if (run.error) {
    console.log(`         │ ❌ Error: ${truncate(run.error, 200)}`)
  }

  // Show the user's input (first message or request)
  if (run.inputs) {
    const input =
      typeof run.inputs === "string"
        ? run.inputs
        : JSON.stringify(run.inputs)
    console.log(`         │ Input: ${truncate(input, 150)}`)
  }
}

function printRunDetail(run: RunRecord) {
  console.log(`  Name:     ${run.name}`)
  console.log(`  Type:     ${run.run_type}`)
  console.log(`  Status:   ${run.error ? "❌ FAILED" : "✅ SUCCESS"}`)
  console.log(`  Duration: ${formatDuration(run.start_time, run.end_time)}`)
  console.log(`  Tokens:   ${run.total_tokens ?? "—"} (prompt: ${run.prompt_tokens ?? "—"}, completion: ${run.completion_tokens ?? "—"})`)
  console.log(`  Tags:     ${run.tags?.join(", ") || "—"}`)

  if (run.error) {
    console.log(`\n  ❌ Error:\n  ${run.error}`)
  }

  console.log(`\n  📥 Input:`)
  console.log(`  ${truncate(JSON.stringify(run.inputs, null, 2), 500)}`)

  if (run.outputs) {
    console.log(`\n  📤 Output:`)
    console.log(`  ${truncate(JSON.stringify(run.outputs, null, 2), 500)}`)
  }
}

main().catch(console.error)
