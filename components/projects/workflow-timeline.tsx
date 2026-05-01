"use client"

import { cn } from "@/lib/utils"
import type { AgentStreamEvent } from "@/lib/orchestration/types"

// ============================================================================
// Types
// ============================================================================

export interface StepSessionMessage {
    role: "user" | "assistant"
    content: string
}

export interface StepMonitoringLog {
    timestamp: string
    sessionId: string
    namespace: string
    level: "debug" | "info" | "warn" | "error"
    message: string
    data?: Record<string, unknown>
    durationMs?: number
}

export interface StepMonitoringSummary {
    sessionId: string
    startedAt: string
    endedAt: string
    totalDurationMs: number
    timers: Record<string, number>
    counts: { debug: number; info: number; warn: number; error: number }
    neuralCosts: Array<{ provider: string; model: string; durationMs: number; estimatedCostUsd: number }>
    ragStats: { totalRetrieved: number; totalRelevant: number; fallbacksUsed: number }
}

export interface StepCommandResult {
    id: string
    tool: string
    status: "pending" | "ready" | "executed" | "failed" | "skipped"
    confidence?: number
    description?: string
    error?: string
}

export interface StepPlanData {
    planSummary: string
    stepCount: number
    executionSuccess: boolean
    errors?: string[]
}

export interface AssetInspectionStats {
    triangleCount?: number
    materialCount?: number
    textureCount?: number
    meshCount?: number
    fileSizeBytes?: number
    sourceToolId?: string
    sourceToolLabel?: string
    sourceProvider?: string
    stageLabel?: string
    thumbnailVersion?: string
    userTags?: string[]
    libraryCategoryOverride?: string
}

export interface WorkflowTimelineNeuralState {
    draftInputs?: Record<string, string>
    viewerUrl?: string | null
    viewerLabel?: string
    viewerSource?: "generated" | "demo" | "input"
    generationTimeMs?: number
    assetStats?: AssetInspectionStats | null
    assetOrigin?: "generated" | "imported"
}

export interface WorkflowTimelineStep {
    id: string
    title: string
    toolName: string
    status: "pending" | "running" | "done" | "failed"
    /** The user's inputs for this step */
    inputs?: Record<string, string>
    /** Conversation ID returned by the API */
    conversationId?: string
    /** Messages in this step's session */
    messages?: StepSessionMessage[]
    /** Monitoring logs streamed during execution */
    monitoringLogs?: StepMonitoringLog[]
    /** Final monitoring summary */
    monitoringSummary?: StepMonitoringSummary | null
    /** Execution plan data */
    planData?: StepPlanData | null
    /** Executed command results */
    commandResults?: StepCommandResult[]
    /** Error message if failed */
    error?: string
    /** Agent stream events (tool calls, etc.) for live activity display */
    agentEvents?: AgentStreamEvent[]
    /** Persisted neural-viewer state for Studio neural tools */
    neuralState?: WorkflowTimelineNeuralState | null
    /** Hidden steps are persisted but excluded from the visible workflow timeline. */
    hiddenFromTimeline?: boolean
}

// ============================================================================
// Props
// ============================================================================

interface WorkflowTimelineProps {
    steps: WorkflowTimelineStep[]
    selectedStepId?: string | null
    onRemoveStep: (stepId: string) => void
    onStepClick: (stepId: string) => void
    onRunAll: () => void
    onClearTimeline?: () => void
}

// ============================================================================
// Component
// ============================================================================

export function WorkflowTimeline({
    steps,
    selectedStepId,
    onRemoveStep,
    onStepClick,
    onRunAll,
    onClearTimeline,
}: WorkflowTimelineProps) {
    const visibleSteps = steps.filter((step) => !step.hiddenFromTimeline)
    const hasVisibleSteps = visibleSteps.length > 0

    return (
        <div
            className="border-t px-6 py-3 flex min-h-[58px] items-center gap-3 overflow-x-auto"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface))",
            }}
        >
            <span
                className="text-xs font-semibold uppercase tracking-wider shrink-0"
                style={{ color: "hsl(var(--forge-text-muted))" }}
            >
                Pipeline
            </span>

            {hasVisibleSteps ? (
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {visibleSteps.map((step, index) => {
                        const isSelected = selectedStepId === step.id
                        return (
                            <div key={step.id} className="flex items-center gap-1.5 shrink-0">
                                {/* Step pill — clickable */}
                                <button
                                    type="button"
                                    onClick={() => onStepClick(step.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                                        "hover:brightness-110",
                                        step.status === "done" && "opacity-60",
                                        step.status === "running" && "animate-pulse",
                                        isSelected && "ring-2 ring-offset-1",
                                    )}
                                    style={{
                                        borderColor:
                                            step.status === "running" || isSelected
                                                ? "hsl(var(--forge-accent))"
                                                : step.status === "failed"
                                                    ? "hsl(0 84% 60%)"
                                                    : "hsl(var(--forge-border))",
                                        backgroundColor:
                                            step.status === "running" || isSelected
                                                ? "hsl(var(--forge-accent-subtle))"
                                                : "hsl(var(--forge-surface))",
                                        color:
                                            step.status === "running" || isSelected
                                                ? "hsl(var(--forge-accent))"
                                                : step.status === "failed"
                                                    ? "hsl(0 84% 60%)"
                                                    : "hsl(var(--forge-text))",
                                        ...(isSelected ? { ringColor: "hsl(var(--forge-accent))" } : {}),
                                    }}
                                >
                                    {/* Status dot */}
                                    <span
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                            step.status === "running" && "animate-ping",
                                        )}
                                        style={{
                                            backgroundColor:
                                                step.status === "done"
                                                    ? "hsl(var(--forge-accent))"
                                                    : step.status === "failed"
                                                        ? "hsl(0 84% 60%)"
                                                        : step.status === "running"
                                                            ? "hsl(var(--forge-accent))"
                                                            : "hsl(var(--forge-text-subtle))",
                                        }}
                                    />
                                    <span>
                                        {index + 1}. {step.title}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRemoveStep(step.id)
                                    }}
                                    className="ml-1 opacity-50 hover:opacity-100 transition text-base leading-none"
                                    style={{ color: "hsl(var(--forge-text-muted))" }}
                                    aria-label={`Remove ${step.title} from pipeline`}
                                    title="Remove step"
                                >
                                    x
                                </button>

                                {/* Connector arrow */}
                                {index < visibleSteps.length - 1 && (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="hsl(var(--forge-text-subtle))"
                                        strokeWidth="2"
                                        className="shrink-0"
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div
                    className="rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        color: "hsl(var(--forge-text-muted))",
                        backgroundColor: "hsl(var(--forge-surface-dim))",
                    }}
                >
                    Add an AI tool to build a visible pipeline. Imported assets stay in the library.
                </div>
            )}

            <div className="flex-1" />

            {/* Clear + Run all buttons */}
            {hasVisibleSteps && onClearTimeline && (
                <button
                    onClick={onClearTimeline}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition hover:opacity-80"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        color: "hsl(var(--forge-text-muted))",
                    }}
                >
                    Clear
                </button>
            )}
            {hasVisibleSteps && (
                <button
                    onClick={onRunAll}
                    className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: "hsl(var(--forge-accent))" }}
                >
                    Run All
                </button>
            )}
        </div>
    )
}
