"use client"

import { useMemo } from "react"
import type { AgentStreamEvent } from "@/lib/orchestration/types"

interface AgentActivityProps {
  events: AgentStreamEvent[]
  isActive: boolean
}

// Tool name → friendly label mapping
const TOOL_LABELS: Record<string, string> = {
  get_scene_info: "Inspecting scene",
  get_object_info: "Reading object",
  get_all_object_info: "Reading all objects",
  get_viewport_screenshot: "Capturing viewport",
  execute_code: "Running Python",
  set_object_transform: "Transforming object",
  create_material: "Creating material",
  assign_material: "Assigning material",
  list_materials: "Listing materials",
  add_light: "Adding light",
  set_light_properties: "Configuring light",
  add_camera: "Adding camera",
  set_camera_properties: "Configuring camera",
  add_modifier: "Adding modifier",
  apply_modifier: "Applying modifier",
  shade_smooth: "Setting shading",
  set_render_settings: "Configuring render",
  render_image: "Rendering image",
  move_to_collection: "Organizing scene",
  rename_object: "Renaming object",
  duplicate_object: "Duplicating object",
  delete_object: "Deleting object",
  parent_set: "Setting parent",
  join_objects: "Joining objects",
  export_object: "Exporting model",
  get_local_asset_library_status: "Checking local library",
  search_local_assets: "Searching local assets",
  import_local_asset: "Importing local asset",
  search_polyhaven_assets: "Searching PolyHaven",
  download_polyhaven_asset: "Downloading asset",
  set_texture: "Applying texture",
}

function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ")
}

// Hammer/wrench icon SVG
function ToolIcon({ status }: { status: "started" | "completed" | "failed" | "skipped" }) {
  const color =
    status === "started"
      ? "hsl(var(--forge-accent))"
      : status === "completed"
        ? "hsl(150 60% 45%)"
        : status === "failed"
          ? "hsl(0 70% 55%)"
          : "hsl(var(--forge-text-muted))"

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {/* Hammer icon */}
      <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
      <path d="M17.64 15L22 10.64" />
      <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
    </svg>
  )
}

// Spinning dots indicator for active processing
function PulsingDot() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
      style={{ backgroundColor: "hsl(var(--forge-accent))" }}
    />
  )
}

export function AgentActivity({ events, isActive }: AgentActivityProps) {
  // Extract tool call events and compute the current activity
  const toolEvents = useMemo(() => {
    const calls: Array<{
      toolName: string
      label: string
      status: "started" | "completed" | "failed" | "skipped"
      timestamp: string
    }> = []

    for (const event of events) {
      if (event.type === "agent:tool_call") {
        const e = event as unknown as {
          toolName: string
          status: "started" | "completed" | "failed" | "skipped"
          timestamp: string
        }
        calls.push({
          toolName: e.toolName,
          label: getToolLabel(e.toolName),
          status: e.status,
          timestamp: e.timestamp,
        })
      }
    }

    return calls
  }, [events])

  // Get the currently running tool (last "started" without a matching "completed")
  const activeTool = useMemo(() => {
    const started = new Set<string>()
    for (const e of toolEvents) {
      if (e.status === "started") started.add(e.toolName)
      else started.delete(e.toolName)
    }
    // Return the last one still running
    for (let i = toolEvents.length - 1; i >= 0; i--) {
      if (started.has(toolEvents[i].toolName) && toolEvents[i].status === "started") {
        return toolEvents[i]
      }
    }
    return null
  }, [toolEvents])

  // Count completed tools
  const completedCount = useMemo(
    () => toolEvents.filter((e) => e.status === "completed").length,
    [toolEvents]
  )

  // Count failed tools
  const failedCount = useMemo(
    () => toolEvents.filter((e) => e.status === "failed").length,
    [toolEvents]
  )

  // Group consecutive completed tools with the same name
  const groupedCompleted = useMemo(() => {
    const groups: Array<{
      toolName: string
      label: string
      count: number
      timestamp: string
    }> = []

    for (const e of toolEvents) {
      if (e.status !== "completed") continue

      const last = groups[groups.length - 1]
      if (last && last.toolName === e.toolName) {
        last.count++
        last.timestamp = e.timestamp // keep latest timestamp
      } else {
        groups.push({
          toolName: e.toolName,
          label: e.label,
          count: 1,
          timestamp: e.timestamp,
        })
      }
    }
    return groups
  }, [toolEvents])

  const allCompleted = useMemo(
    () => toolEvents.filter((e) => e.status === "completed"),
    [toolEvents]
  )

  const allFailed = useMemo(
    () => toolEvents.filter((e) => e.status === "failed"),
    [toolEvents]
  )
  const isReasoning = isActive && !activeTool

  if (!isActive && toolEvents.length === 0) return null

  // ── Collapsed summary when agent is done ──
  if (!isActive && completedCount > 0) {
    return (
      <details
        className="rounded-xl border px-4 py-3 mb-3 transition-all duration-300"
        style={{
          backgroundColor: "var(--forge-glass)",
          borderColor: "hsl(var(--forge-border))",
          backdropFilter: "blur(12px)",
          boxShadow: "var(--forge-shadow)",
        }}
      >
        <summary
          className="cursor-pointer flex items-center gap-2 text-xs font-semibold uppercase tracking-wider select-none"
          style={{ color: "hsl(var(--forge-text-subtle))" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="hsl(150 60% 45%)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Done — {completedCount} tool{completedCount !== 1 ? "s" : ""} used{failedCount > 0 ? `, ${failedCount} failed` : ""}
        </summary>
        <div className="mt-2 space-y-0.5">
          {allCompleted.map((e, i) => (
            <div
              key={`${e.toolName}-${e.timestamp}-${i}`}
              className="flex items-center gap-2 py-1 px-2 rounded-lg opacity-60"
            >
              <ToolIcon status="completed" />
              <span
                className="text-xs"
                style={{ color: "hsl(var(--forge-text-muted))" }}
              >
                {e.label}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(150 60% 45%)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto shrink-0"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ))}
          {allFailed.map((e, i) => (
            <div
              key={`failed-${e.toolName}-${e.timestamp}-${i}`}
              className="flex items-center gap-2 py-1 px-2 rounded-lg opacity-70"
            >
              <ToolIcon status="failed" />
              <span
                className="text-xs"
                style={{ color: "hsl(0 70% 55%)" }}
              >
                {e.label} — failed
              </span>
            </div>
          ))}
        </div>
      </details>
    )
  }

  // ── Live streaming panel ──
  return (
    <div
      className="rounded-xl border px-4 py-3 mb-3 transition-all duration-300"
      style={{
        backgroundColor: "var(--forge-glass)",
        borderColor: "hsl(var(--forge-border))",
        backdropFilter: "blur(12px)",
        boxShadow: "var(--forge-shadow)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <PulsingDot />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "hsl(var(--forge-text-subtle))" }}
        >
          Agent working
        </span>
      </div>

      {/* Active tool */}
      {activeTool && (
        <div
          className="flex items-center gap-2 py-1.5 px-2 rounded-lg mb-1"
          style={{ backgroundColor: "hsl(var(--forge-accent-subtle))" }}
        >
          <ToolIcon status="started" />
          <span
            className="text-sm font-medium"
            style={{ color: "hsl(var(--forge-accent))" }}
          >
            {activeTool.label}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <span
              className="w-1 h-1 rounded-full animate-bounce"
              style={{ backgroundColor: "hsl(var(--forge-accent))", animationDelay: "0ms" }}
            />
            <span
              className="w-1 h-1 rounded-full animate-bounce"
              style={{ backgroundColor: "hsl(var(--forge-accent))", animationDelay: "150ms" }}
            />
            <span
              className="w-1 h-1 rounded-full animate-bounce"
              style={{ backgroundColor: "hsl(var(--forge-accent))", animationDelay: "300ms" }}
            />
          </span>
        </div>
      )}

      {/* Reasoning state between tool calls */}
      {isReasoning && (
        <div
          className="flex items-center gap-2 py-1.5 px-2 rounded-lg mb-1"
          style={{ backgroundColor: "hsl(var(--forge-surface-dim))" }}
        >
          <svg
            className="w-4 h-4 animate-spin shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="hsl(var(--forge-accent))"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <span
            className="text-sm font-medium"
            style={{ color: "hsl(var(--forge-accent))" }}
          >
            Thinking…
          </span>
        </div>
      )}

      {/* All completed tools (grouped by consecutive identical names) */}
      {groupedCompleted.length > 0 && (
        <div className="space-y-0.5">
          {groupedCompleted.map((g, i) => (
            <div
              key={`${g.toolName}-${g.timestamp}-${i}`}
              className="flex items-center gap-2 py-1 px-2 rounded-lg opacity-60"
            >
              <ToolIcon status="completed" />
              <span
                className="text-xs"
                style={{ color: "hsl(var(--forge-text-muted))" }}
              >
                {g.label}{g.count > 1 ? ` ×${g.count}` : ""}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(150 60% 45%)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto shrink-0"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
