"use client"

import { useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
    WorkflowProposal,
    WorkflowStep,
    WorkflowStepStatus,
    WorkflowStepAction,
    WorkflowStepResult,
} from "@/lib/orchestration/workflow-types"

// ─── Icons for each tool ──────────────────────────────────────────

const TOOL_ICONS: Record<string, string> = {
    neural: "🧠",
    blender_agent: "🤖",
    manual: "✋",
}

const TOOL_LABELS: Record<string, string> = {
    neural: "Neural AI",
    blender_agent: "Blender Agent β",
    manual: "Manual",
}

const STATUS_CONFIG: Record<
    WorkflowStepStatus,
    { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: string }
> = {
    pending: { label: "Pending", variant: "outline", icon: "○" },
    running: { label: "Running", variant: "secondary", icon: "⏳" },
    completed: { label: "Completed", variant: "default", icon: "✅" },
    failed: { label: "Failed", variant: "destructive", icon: "❌" },
    skipped: { label: "Skipped", variant: "outline", icon: "⏭" },
    manual: { label: "Done Manually", variant: "secondary", icon: "✋" },
}

const CATEGORY_COLORS: Record<string, string> = {
    geometry: "border-teal-600/30 bg-teal-600/5",
    topology: "border-green-500/30 bg-green-500/5",
    uv: "border-yellow-500/30 bg-yellow-500/5",
    texturing: "border-teal-500/30 bg-teal-500/5",
    rigging: "border-orange-500/30 bg-orange-500/5",
    animation: "border-pink-500/30 bg-pink-500/5",
    lighting: "border-amber-500/30 bg-amber-500/5",
    export: "border-cyan-500/30 bg-cyan-500/5",
    composition: "border-teal-500/30 bg-teal-500/5",
    other: "border-border/60 bg-muted/10",
}

// ─── Props ────────────────────────────────────────────────────────

interface WorkflowPanelProps {
    proposal: WorkflowProposal
    /** Called when user takes action on any step */
    onStepAction?: (stepId: string, action: WorkflowStepAction) => void
}

// ─── Step Card Component ────────────────────────────────────────

function StepCard({
    step,
    isBlocked,
    onAction,
    isExecuting,
}: {
    step: WorkflowStep & { status: WorkflowStepStatus }
    isBlocked: boolean
    onAction: (action: WorkflowStepAction) => void
    isExecuting: boolean
}) {
    const status = STATUS_CONFIG[step.status]
    const categoryColor = CATEGORY_COLORS[step.category] ?? CATEGORY_COLORS.other
    const toolIcon = TOOL_ICONS[step.recommendedTool] ?? "🔧"
    const toolLabel = TOOL_LABELS[step.recommendedTool] ?? step.recommendedTool

    const isActionable = step.status === "pending" && !isBlocked && !isExecuting
    const isRunning = step.status === "running"

    return (
        <div
            className={`rounded-lg border ${categoryColor} p-3 transition-all duration-200 ${isRunning ? "ring-2 ring-primary/50 shadow-sm" : ""
                } ${step.status === "completed" ? "opacity-80" : ""} ${step.status === "skipped" ? "opacity-50" : ""
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground/60">
                        {step.stepNumber}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                        {step.title}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={status.variant} className="text-[10px] uppercase tracking-wide">
                        {status.icon} {status.label}
                    </Badge>
                </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground mb-2">{step.description}</p>

            {/* Tool recommendation */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{toolIcon}</span>
                <div>
                    <span className="text-xs font-medium text-foreground">
                        Recommended: {toolLabel}
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                        {step.toolReasoning}
                    </p>
                </div>
            </div>

            {/* Alternative tools */}
            {step.alternativeTools.length > 0 && (
                <p className="text-[10px] text-muted-foreground/60 mb-2">
                    Alternatives:{" "}
                    {step.alternativeTools
                        .map((t) => `${TOOL_ICONS[t] ?? ""} ${TOOL_LABELS[t] ?? t}`)
                        .join(", ")}
                </p>
            )}

            {/* Pro tip */}
            {step.tips && (
                <div className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 mb-2">
                    💡 {step.tips}
                </div>
            )}

            {/* Duration estimate */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 mb-2">
                <span>⏱ {step.estimatedDuration}</span>
                <span className="uppercase">{step.category}</span>
                {step.neuralProvider && (
                    <span>Provider: {step.neuralProvider}</span>
                )}
            </div>

            {/* Error message */}
            {step.error && (
                <div className="text-[11px] text-destructive bg-destructive/10 rounded px-2 py-1 mb-2">
                    {step.error}
                </div>
            )}

            {/* Action buttons */}
            {isActionable && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                    <Button
                        size="sm"
                        variant="default"
                        className="text-xs h-7 px-3"
                        onClick={() => onAction("execute")}
                    >
                        ▶ Execute
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-3"
                        onClick={() => onAction("manual_done")}
                    >
                        ✋ Done Manually
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-3 text-muted-foreground"
                        onClick={() => onAction("skip")}
                    >
                        ⏭ Skip
                    </Button>
                </div>
            )}

            {/* Running spinner */}
            {isRunning && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30 text-xs text-primary">
                    <span className="animate-spin">⏳</span>
                    <span>Executing step...</span>
                </div>
            )}

            {/* Blocked */}
            {step.status === "pending" && isBlocked && !isExecuting && (
                <div className="text-[11px] text-muted-foreground/50 mt-2 pt-2 border-t border-border/30">
                    ⏸ Waiting for previous step to complete
                </div>
            )}
        </div>
    )
}

// ─── Main Workflow Panel ──────────────────────────────────────────

export function WorkflowPanel({ proposal, onStepAction }: WorkflowPanelProps) {
    const [steps, setSteps] = useState<(WorkflowStep & { status: WorkflowStepStatus })[]>(
        proposal.steps.map((s) => ({ ...s, status: s.status ?? "pending" }))
    )
    const [executingStepId, setExecutingStepId] = useState<string | null>(null)

    const completedCount = steps.filter(
        (s) => s.status === "completed" || s.status === "skipped" || s.status === "manual"
    ).length
    const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0

    const handleStepAction = useCallback(
        async (stepId: string, action: WorkflowStepAction) => {
            const stepIndex = steps.findIndex((s) => s.id === stepId)
            if (stepIndex === -1) return

            const step = steps[stepIndex]

            // Optimistic update for skip and manual
            if (action === "skip" || action === "manual_done") {
                setSteps((prev) =>
                    prev.map((s) =>
                        s.id === stepId
                            ? { ...s, status: action === "skip" ? "skipped" as const : "manual" as const }
                            : s
                    )
                )
                onStepAction?.(stepId, action)
                // Fire API call in background
                fetch("/api/ai/workflow-step", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId: "",
                        workflowId: proposal.id,
                        stepId,
                        action,
                    }),
                }).catch(console.error)
                return
            }

            // Execute action
            setExecutingStepId(stepId)
            setSteps((prev) =>
                prev.map((s) => (s.id === stepId ? { ...s, status: "running" as const } : s))
            )
            onStepAction?.(stepId, action)

            try {
                const res = await fetch("/api/ai/workflow-step", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId: "",
                        workflowId: proposal.id,
                        stepId,
                        action: "execute",
                        userRequest: proposal.userRequest,
                        step: {
                            title: step.title,
                            description: step.description,
                            recommendedTool: step.recommendedTool,
                            category: step.category,
                            neuralProvider: step.neuralProvider,
                        },
                    }),
                })

                const result = (await res.json()) as WorkflowStepResult

                setSteps((prev) =>
                    prev.map((s) =>
                        s.id === stepId
                            ? {
                                ...s,
                                status: result.status,
                                error: result.error,
                                outputPath: result.outputPath,
                            }
                            : s
                    )
                )
            } catch (err) {
                setSteps((prev) =>
                    prev.map((s) =>
                        s.id === stepId
                            ? {
                                ...s,
                                status: "failed" as const,
                                error: err instanceof Error ? err.message : "Step execution failed",
                            }
                            : s
                    )
                )
            } finally {
                setExecutingStepId(null)
            }
        },
        [steps, proposal.id, proposal.userRequest, onStepAction]
    )

    const isStepBlocked = (step: WorkflowStep, index: number): boolean => {
        if (!step.requiresPreviousStep || index === 0) return false
        const prev = steps[index - 1]
        return prev.status !== "completed" && prev.status !== "skipped" && prev.status !== "manual"
    }

    return (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-primary">{proposal.title}</h3>
                    <p className="text-xs text-muted-foreground">
                        {steps.length} steps • Execute each step, do it manually, or skip
                    </p>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase">
                    {proposal.strategy}
                </Badge>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{completedCount} / {steps.length} steps done</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Overall tips */}
            {proposal.overallTips.length > 0 && (
                <details className="text-[11px] text-muted-foreground">
                    <summary className="cursor-pointer text-primary font-medium">
                        💡 Workflow tips ({proposal.overallTips.length})
                    </summary>
                    <ul className="mt-1 space-y-1 pl-4 list-disc">
                        {proposal.overallTips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ul>
                </details>
            )}

            {/* Step cards */}
            <div className="space-y-2">
                {steps.map((step, index) => (
                    <StepCard
                        key={step.id}
                        step={step}
                        isBlocked={isStepBlocked(step, index)}
                        onAction={(action) => handleStepAction(step.id, action)}
                        isExecuting={executingStepId === step.id}
                    />
                ))}
            </div>

            {/* Completion message */}
            {progress === 100 && (
                <div className="text-sm text-primary font-medium text-center py-2 border-t border-primary/20">
                    ✨ Workflow complete!
                </div>
            )}
        </div>
    )
}
