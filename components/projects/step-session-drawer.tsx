"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { MonitoringPanel } from "./monitoring-panel"
import { AgentActivity } from "./agent-activity"
import type { WorkflowTimelineStep } from "./workflow-timeline"

// Tool name → friendly label mapping (shared with agent-activity.tsx)
const TOOL_LABELS: Record<string, string> = {
    get_scene_info: "Inspecting scene",
    get_object_info: "Reading object",
    get_all_object_info: "Reading all objects",
    get_viewport_screenshot: "Capturing viewport",
    execute_code: "Running Python code",
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
    search_polyhaven_assets: "Searching PolyHaven",
    download_polyhaven_asset: "Downloading asset",
    set_texture: "Applying texture",
    list_installed_addons: "Detecting addons",
}

function getToolLabel(toolName: string): string {
    return TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ")
}

// ============================================================================
// Props
// ============================================================================

interface StepSessionDrawerProps {
    step: WorkflowTimelineStep
    onClose: () => void
    onSendMessage: (stepId: string, message: string) => void
    onStop?: (stepId: string) => void
}

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: WorkflowTimelineStep["status"] }) {
    const config = {
        pending: { label: "Pending", dotClass: "bg-zinc-400", bg: "rgba(113,113,122,0.15)", text: "hsl(var(--forge-text-subtle))" },
        running: { label: "Running", dotClass: "bg-teal-400 animate-pulse", bg: "hsl(var(--forge-accent-subtle))", text: "hsl(var(--forge-accent))" },
        done: { label: "Complete", dotClass: "bg-emerald-400", bg: "rgba(52,211,153,0.15)", text: "hsl(153 60% 53%)" },
        failed: { label: "Failed", dotClass: "bg-red-400", bg: "rgba(248,113,113,0.15)", text: "hsl(0 84% 60%)" },
    }
    const c = config[status]

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: c.bg, color: c.text }}
        >
            <span className={cn("w-2 h-2 rounded-full shrink-0", c.dotClass)} />
            {c.label}
        </span>
    )
}

// ============================================================================
// Drawer
// ============================================================================

export function StepSessionDrawer({
    step,
    onClose,
    onSendMessage,
    onStop,
}: StepSessionDrawerProps) {
    const [followUp, setFollowUp] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Animate in on mount
    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true))
    }, [])

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [step.messages])

    // Focus input when step completes
    useEffect(() => {
        if (step.status === "done" || step.status === "failed") {
            inputRef.current?.focus()
        }
    }, [step.status])

    const handleClose = () => {
        setIsVisible(false)
        setTimeout(onClose, 250) // Wait for animation
    }

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!followUp.trim() || step.status === "running") return
        onSendMessage(step.id, followUp.trim())
        setFollowUp("")
    }

    const rawMessages = step.messages ?? []
    const logs = step.monitoringLogs ?? []
    const summary = step.monitoringSummary ?? null

    // Filter out the first user message when it duplicates the "YOUR PROMPT" header
    const messages = useMemo(() => {
        if (!step.inputs?.prompt || rawMessages.length === 0) return rawMessages
        const first = rawMessages[0]
        if (first?.role === "user" && first.content?.trim() === step.inputs.prompt.trim()) {
            return rawMessages.slice(1)
        }
        return rawMessages
    }, [rawMessages, step.inputs?.prompt])

    return (
        <div
            className={cn(
                "absolute inset-0 z-30 flex flex-col overflow-hidden rounded-t-2xl transition-transform duration-300 ease-out",
                isVisible ? "translate-y-0" : "translate-y-full",
            )}
            style={{
                backgroundColor: "hsl(var(--forge-surface))",
                borderTop: "2px solid hsl(var(--forge-accent))",
            }}
        >
            {/* ── Header ─────────────────────────────────────────── */}
            <div
                className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                style={{ borderColor: "hsl(var(--forge-border))" }}
            >
                <div className="flex items-center gap-3">
                    <h3
                        className="text-lg font-bold"
                        style={{ color: "hsl(var(--forge-text))" }}
                    >
                        {step.title}
                    </h3>
                    <StatusBadge status={step.status} />
                </div>
                <button
                    onClick={handleClose}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: "hsl(var(--forge-text-muted))" }}
                    aria-label="Close session drawer"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* ── Body ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* Prompt */}
                {step.inputs?.prompt && (
                    <div className="space-y-1.5">
                        <span
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: "hsl(var(--forge-text-subtle))" }}
                        >
                            Your prompt
                        </span>
                        <div
                            className="rounded-xl px-4 py-3 text-sm"
                            style={{
                                backgroundColor: "hsl(var(--forge-accent-subtle))",
                                color: "hsl(var(--forge-text))",
                                border: "1px solid hsl(var(--forge-accent) / 0.3)",
                            }}
                        >
                            {step.inputs.prompt}
                        </div>
                    </div>
                )}

                {/* Messages */}
                {messages.length > 0 && (
                    <div className="space-y-3">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className="max-w-[85%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap"
                                    style={{
                                        backgroundColor:
                                            msg.role === "user"
                                                ? "hsl(var(--forge-accent-subtle))"
                                                : "hsl(var(--forge-surface-dim))",
                                        color: "hsl(var(--forge-text))",
                                        border: `1px solid ${msg.role === "user"
                                            ? "hsl(var(--forge-accent) / 0.3)"
                                            : "hsl(var(--forge-border))"
                                            }`,
                                    }}
                                >
                                    {msg.content || (
                                        step.status === "running" && msg.role === "assistant" ? (
                                            <span className="flex items-center gap-2" style={{ color: "hsl(var(--forge-accent))" }}>
                                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--forge-accent))" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" opacity="0.25" />
                                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                                </svg>
                                                Thinking…
                                            </span>
                                        ) : null
                                    )}
                                </div>
                            </div>
                        ))}
                        {/* Agent tool call activity */}
                        {step.status === "running" && step.agentEvents && step.agentEvents.length > 0 && (
                            <AgentActivity events={step.agentEvents} isActive={true} />
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Empty state */}
                {messages.length === 0 && step.status === "pending" && (
                    <div
                        className="text-center py-12 text-sm"
                        style={{ color: "hsl(var(--forge-text-subtle))" }}
                    >
                        This step hasn&apos;t been executed yet.
                    </div>
                )}

                {/* Error */}
                {step.error && (
                    <div
                        className="rounded-xl px-4 py-3 text-sm border"
                        style={{
                            backgroundColor: "hsl(0 84% 60% / 0.1)",
                            borderColor: "hsl(0 84% 60% / 0.3)",
                            color: "hsl(0 84% 60%)",
                        }}
                    >
                        <strong>Error:</strong> {step.error}
                    </div>
                )}

                {/* Plan Summary */}
                {step.planData && (
                    <div
                        className="rounded-xl border px-4 py-3 space-y-2"
                        style={{
                            borderColor: step.planData.executionSuccess
                                ? "hsl(153 60% 53% / 0.3)"
                                : "hsl(0 84% 60% / 0.3)",
                            backgroundColor: step.planData.executionSuccess
                                ? "rgba(52,211,153,0.08)"
                                : "rgba(248,113,113,0.08)",
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="text-xs font-semibold uppercase tracking-wider"
                                style={{ color: "hsl(var(--forge-text-subtle))" }}
                            >
                                Execution Plan
                            </span>
                            <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                    backgroundColor: step.planData.executionSuccess
                                        ? "rgba(52,211,153,0.2)"
                                        : "rgba(248,113,113,0.2)",
                                    color: step.planData.executionSuccess
                                        ? "hsl(153 60% 53%)"
                                        : "hsl(0 84% 60%)",
                                }}
                            >
                                {step.planData.executionSuccess ? "✓ Success" : "✕ Failed"} · {step.planData.stepCount} step{step.planData.stepCount !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <p className="text-sm" style={{ color: "hsl(var(--forge-text))" }}>
                            {step.planData.planSummary}
                        </p>
                        {step.planData.errors && step.planData.errors.length > 0 && (
                            <div className="text-xs space-y-1" style={{ color: "hsl(0 84% 60%)" }}>
                                {step.planData.errors.map((err, i) => (
                                    <p key={i}>⚠ {err}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Command Results */}
                {step.commandResults && step.commandResults.length > 0 && (
                    <div className="space-y-1.5">
                        <span
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: "hsl(var(--forge-text-subtle))" }}
                        >
                            Executed Commands ({step.commandResults.length})
                        </span>
                        <div className="space-y-1">
                            {step.commandResults.map((cmd) => (
                                <div
                                    key={cmd.id}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                                    style={{
                                        backgroundColor: "hsl(var(--forge-surface-dim))",
                                        border: "1px solid hsl(var(--forge-border))",
                                        color: "hsl(var(--forge-text))",
                                    }}
                                    title={cmd.tool}
                                >
                                    <span className="shrink-0">
                                        {cmd.status === "executed" ? "✅" : cmd.status === "failed" ? "❌" : "⏳"}
                                    </span>
                                    <span className="truncate flex-1 font-medium">{getToolLabel(cmd.tool)}</span>
                                    {cmd.description && (
                                        <span
                                            className="text-[10px] truncate max-w-[40%]"
                                            style={{ color: "hsl(var(--forge-text-subtle))" }}
                                        >
                                            {cmd.description}
                                        </span>
                                    )}
                                    {cmd.error && (
                                        <span
                                            className="text-[10px] max-w-[40%] overflow-x-auto whitespace-nowrap"
                                            style={{ color: "hsl(0 84% 60%)" }}
                                            title={cmd.error}
                                        >
                                            {cmd.error}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pipeline Monitor */}
                {logs.length > 0 && (
                    <MonitoringPanel logs={logs} summary={summary} />
                )}
            </div>

            {/* ── Footer ──────────────────────────────────────────── */}
            {(step.status === "done" || step.status === "failed") && (
                <form
                    onSubmit={handleSend}
                    className="px-6 py-4 border-t flex items-center gap-3 shrink-0"
                    style={{ borderColor: "hsl(var(--forge-border))" }}
                >
                    <input
                        ref={inputRef}
                        value={followUp}
                        onChange={(e) => setFollowUp(e.target.value)}
                        placeholder="Send a follow-up message..."
                        className="flex-1 rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "hsl(var(--forge-surface-dim))",
                            color: "hsl(var(--forge-text))",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!followUp.trim()}
                        className="p-2.5 rounded-xl text-white transition disabled:opacity-40"
                        style={{ backgroundColor: "hsl(var(--forge-accent))" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </form>
            )}

            {/* Running indicator */}
            {step.status === "running" && (
                <div
                    className="px-6 py-3 border-t flex items-center gap-3 shrink-0"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        backgroundColor: "hsl(var(--forge-accent-subtle))",
                    }}
                >
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--forge-accent))" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span className="text-sm font-medium flex-1" style={{ color: "hsl(var(--forge-accent))" }}>
                        Agent is processing...
                    </span>
                    {onStop && (
                        <button
                            type="button"
                            onClick={() => onStop(step.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90"
                            style={{
                                backgroundColor: "hsl(0 84% 60%)",
                                color: "#fff",
                            }}
                        >
                            ■ Stop
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
