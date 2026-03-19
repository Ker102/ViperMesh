"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { StudioSidebar } from "./studio-sidebar"
import { StudioWorkspace } from "./studio-workspace"
import { StudioAdvisor } from "./studio-advisor"
import { WorkflowTimeline, type WorkflowTimelineStep, type StepMonitoringLog, type StepPlanData, type StepCommandResult } from "./workflow-timeline"
import { StepSessionDrawer } from "./step-session-drawer"
import type { ToolEntry } from "@/lib/orchestration/tool-catalog"

interface StudioLayoutProps {
    projectId: string
}

// ── API persistence helpers (replaces localStorage) ─────────────
async function fetchPersistedSteps(projectId: string): Promise<WorkflowTimelineStep[]> {
    try {
        const res = await fetch(`/api/projects/studio-session?projectId=${projectId}`)
        if (!res.ok) return []
        const data = await res.json()
        const steps = data.steps as WorkflowTimelineStep[] | undefined
        if (!Array.isArray(steps)) return []
        // Steps that were "running" when the page closed can't be resumed — mark as failed
        return steps.map((step) =>
            step.status === "running"
                ? { ...step, status: "failed" as const, error: step.error ?? "Session interrupted" }
                : step
        )
    } catch {
        return []
    }
}

async function savePersistedSteps(projectId: string, steps: WorkflowTimelineStep[]) {
    try {
        // Strip monitoring logs before saving to keep payload reasonable
        const slim = steps.map(({ monitoringLogs, ...rest }) => rest)
        const res = await fetch("/api/projects/studio-session", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, steps: slim }),
        })
        if (!res.ok) {
            console.warn(`[StudioLayout] Failed to persist steps: HTTP ${res.status}`)
        }
    } catch (err) {
        console.warn("[StudioLayout] Failed to persist steps:", err)
    }
}

async function deletePersistedSteps(projectId: string) {
    try {
        await fetch(`/api/projects/studio-session?projectId=${projectId}`, { method: "DELETE" })
    } catch (err) {
        console.warn("[StudioLayout] Failed to delete steps:", err)
    }
}

export function StudioLayout({ projectId }: StudioLayoutProps) {
    const [activeCategory, setActiveCategory] = useState("shape")
    const [assistantOpen, setAssistantOpen] = useState(false)
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowTimelineStep[]>([])
    const [stepsLoading, setStepsLoading] = useState(true)
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const initialLoadDone = useRef(false)

    // ── Load steps from API on mount ─────────────────────────────
    useEffect(() => {
        let cancelled = false
        fetchPersistedSteps(projectId).then((steps) => {
            if (!cancelled) {
                setWorkflowSteps(steps)
                setStepsLoading(false)
                initialLoadDone.current = true
            }
        })
        return () => { cancelled = true }
    }, [projectId])

    // ── Debounced save to API ────────────────────────────────────
    useEffect(() => {
        if (!initialLoadDone.current) return // Don't save until initial load completes
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
            savePersistedSteps(projectId, workflowSteps)
        }, 500)
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        }
    }, [workflowSteps, projectId])

    // ── Helpers ──────────────────────────────────────────────────

    const updateStep = useCallback(
        (stepId: string, patch: Partial<WorkflowTimelineStep>) => {
            setWorkflowSteps((prev) =>
                prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s))
            )
        },
        []
    )

    const appendMessage = useCallback(
        (stepId: string, role: "user" | "assistant", content: string) => {
            setWorkflowSteps((prev) =>
                prev.map((s) =>
                    s.id === stepId
                        ? { ...s, messages: [...(s.messages ?? []), { role, content }] }
                        : s
                )
            )
        },
        []
    )

    const appendMonitoringLog = useCallback(
        (stepId: string, log: StepMonitoringLog) => {
            setWorkflowSteps((prev) =>
                prev.map((s) =>
                    s.id === stepId
                        ? { ...s, monitoringLogs: [...(s.monitoringLogs ?? []), log] }
                        : s
                )
            )
        },
        []
    )

    const updateAssistantContent = useCallback(
        (stepId: string, content: string) => {
            setWorkflowSteps((prev) =>
                prev.map((s) => {
                    if (s.id !== stepId) return s
                    const msgs = [...(s.messages ?? [])]
                    const lastIdx = msgs.length - 1
                    if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
                        msgs[lastIdx] = { ...msgs[lastIdx], content }
                    }
                    return { ...s, messages: msgs }
                })
            )
        },
        []
    )

    // ── Execute a step via the chat API ─────────────────────────

    const executeStep = useCallback(
        async (stepId: string, message: string, conversationId?: string) => {
            // Abort any previous request
            abortControllerRef.current?.abort()
            const abort = new AbortController()
            abortControllerRef.current = abort

            updateStep(stepId, { status: "running" })
            appendMessage(stepId, "user", message)
            appendMessage(stepId, "assistant", "") // placeholder for streaming

            let assistantContent = ""
            let streamConversationId = conversationId

            try {
                const res = await fetch("/api/ai/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        projectId,
                        conversationId: streamConversationId,
                        message,
                        // Studio step execution: skip text streaming + strategy classification
                        // (the user already chose the tool, we just need the agent to execute it)
                        workflowMode: "studio",
                        studioStep: true,
                    }),
                    signal: abort.signal,
                })

                if (!res.ok) {
                    const errorText = await res.text()
                    throw new Error(errorText || `HTTP ${res.status}`)
                }

                const reader = res.body?.getReader()
                if (!reader) throw new Error("No response body")

                const decoder = new TextDecoder()
                let buffer = ""
                let done = false

                while (!done) {
                    const chunk = await reader.read()
                    if (chunk.done) {
                        done = true
                    }
                    buffer += decoder.decode(chunk.value ?? new Uint8Array(), { stream: !chunk.done })

                    let nlIndex: number
                    while ((nlIndex = buffer.indexOf("\n")) !== -1) {
                        const line = buffer.slice(0, nlIndex).trim()
                        buffer = buffer.slice(nlIndex + 1)
                        if (!line) continue

                        let event: Record<string, unknown>
                        try {
                            event = JSON.parse(line) as Record<string, unknown>
                        } catch {
                            continue
                        }

                        const eventType = typeof event.type === "string" ? event.type : undefined
                        if (!eventType) continue

                        switch (eventType) {
                            case "init": {
                                const id = typeof event.conversationId === "string" ? event.conversationId : undefined
                                if (id) {
                                    streamConversationId = id
                                    updateStep(stepId, { conversationId: id })
                                }
                                break
                            }
                            case "delta": {
                                const delta = typeof event.delta === "string" ? event.delta : ""
                                assistantContent += delta
                                updateAssistantContent(stepId, assistantContent)
                                break
                            }
                            case "followup_delta": {
                                // Post-execution follow-up text from the LLM
                                const fDelta = typeof event.delta === "string" ? event.delta : ""
                                assistantContent += fDelta
                                updateAssistantContent(stepId, assistantContent)
                                break
                            }
                            case "complete": {
                                const cid = typeof event.conversationId === "string" ? event.conversationId : undefined
                                if (cid) {
                                    updateStep(stepId, { conversationId: cid })
                                }

                                // Extract plan data from the planning metadata
                                const planning = event.planning as Record<string, unknown> | undefined
                                let planData: StepPlanData | null = null
                                if (planning) {
                                    planData = {
                                        planSummary: typeof planning.planSummary === "string" ? planning.planSummary : "No summary",
                                        stepCount: Array.isArray(planning.planSteps) ? planning.planSteps.length : 0,
                                        executionSuccess: planning.executionSuccess === true,
                                        errors: Array.isArray(planning.errors) ? planning.errors as string[] : undefined,
                                    }
                                }

                                // Extract command results
                                const rawCommands = Array.isArray(event.commandSuggestions) ? event.commandSuggestions as Record<string, unknown>[] : []
                                const VALID_CMD_STATUSES = new Set<StepCommandResult["status"]>(["pending", "executed", "failed", "skipped"])
                                const commandResults: StepCommandResult[] = rawCommands.map((cmd) => {
                                    const rawStatus = cmd.status as StepCommandResult["status"]
                                    return {
                                        id: String(cmd.id ?? ""),
                                        tool: String(cmd.tool ?? ""),
                                        status: VALID_CMD_STATUSES.has(rawStatus) ? rawStatus : "pending",
                                        confidence: typeof cmd.confidence === "number" ? cmd.confidence : undefined,
                                        description: typeof cmd.description === "string" ? cmd.description : undefined,
                                        error: typeof cmd.error === "string" ? cmd.error : undefined,
                                    }
                                })

                                updateStep(stepId, {
                                    status: "done",
                                    planData,
                                    commandResults: commandResults.length > 0 ? commandResults : undefined,
                                })
                                done = true
                                break
                            }
                            case "error": {
                                const errMsg = typeof event.error === "string" ? event.error : "Unknown error"
                                updateStep(stepId, { status: "failed", error: errMsg })
                                done = true
                                break
                            }
                            default: {
                                // Handle agent stream events
                                if (eventType.startsWith("agent:")) {
                                    if (eventType === "agent:monitoring_log") {
                                        const logEntry = (event as Record<string, unknown>).entry as StepMonitoringLog | undefined
                                        if (logEntry) {
                                            appendMonitoringLog(stepId, logEntry)
                                        }
                                    } else if (eventType === "agent:monitoring_summary") {
                                        const summaryData = (event as Record<string, unknown>).summary
                                        if (summaryData) {
                                            updateStep(stepId, {
                                                monitoringSummary: summaryData as WorkflowTimelineStep["monitoringSummary"],
                                            })
                                        }
                                    }
                                }
                                break
                            }
                        }
                    }
                }

                // If we didn't get a "complete" event, decide final status
                setWorkflowSteps((prev) =>
                    prev.map((s) => {
                        if (s.id !== stepId || s.status !== "running") return s
                        // Check if there were execution errors
                        const hasErrors = s.planData?.errors && s.planData.errors.length > 0
                        const hasFailed = s.planData?.executionSuccess === false
                        return { ...s, status: hasErrors || hasFailed ? "failed" : "done" }
                    })
                )
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return
                const errorMessage = err instanceof Error ? err.message : "Something went wrong"
                updateStep(stepId, { status: "failed", error: errorMessage })
            }
        },
        [projectId, updateStep, appendMessage, appendMonitoringLog, updateAssistantContent]
    )

    // ── Handlers ────────────────────────────────────────────────

    const handleToolSelect = useCallback(
        (tool: ToolEntry, inputs: Record<string, string>) => {
            const step: WorkflowTimelineStep = {
                id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                title: tool.name,
                toolName: tool.id,
                status: "pending",
                inputs,
            }
            setWorkflowSteps((prev) => [...prev, step])
        },
        []
    )

    const handleRemoveStep = useCallback((stepId: string) => {
        setWorkflowSteps((prev) => prev.filter((s) => s.id !== stepId))
        if (selectedStepId === stepId) setSelectedStepId(null)
    }, [selectedStepId])

    const handleRunAll = useCallback(() => {
        // Run each pending step sequentially
        const pendingSteps = workflowSteps.filter((s) => s.status === "pending")
        if (pendingSteps.length === 0) return

        // Run first pending step — subsequent steps can be chained later
        const first = pendingSteps[0]
        const prompt = first.inputs?.prompt ?? first.title
        setSelectedStepId(first.id)
        executeStep(first.id, prompt)
    }, [workflowSteps, executeStep])

    const handleClearTimeline = useCallback(() => {
        abortControllerRef.current?.abort()
        setWorkflowSteps([])
        setSelectedStepId(null)
        deletePersistedSteps(projectId)
    }, [projectId])

    const handleToolRunNow = useCallback(
        (tool: ToolEntry, inputs: Record<string, string>) => {
            const stepId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            const step: WorkflowTimelineStep = {
                id: stepId,
                title: tool.name,
                toolName: tool.id,
                status: "pending",
                inputs,
            }
            setWorkflowSteps((prev) => [...prev, step])
            setSelectedStepId(stepId)

            // Execute immediately
            const prompt = inputs.prompt ?? inputs.description ?? `Run ${tool.name}`
            executeStep(stepId, prompt)
        },
        [executeStep]
    )

    const handleStepClick = useCallback((stepId: string) => {
        setSelectedStepId((prev) => (prev === stepId ? null : stepId))
    }, [])

    const handleStopStep = useCallback((stepId: string) => {
        abortControllerRef.current?.abort()
        abortControllerRef.current = null
        setWorkflowSteps((prev) =>
            prev.map((s) =>
                s.id === stepId && s.status === "running"
                    ? { ...s, status: "failed" as const, error: "Stopped by user" }
                    : s
            )
        )
    }, [])

    const handleSendMessage = useCallback(
        (stepId: string, message: string) => {
            const step = workflowSteps.find((s) => s.id === stepId)
            if (!step) return
            executeStep(stepId, message, step.conversationId)
        },
        [workflowSteps, executeStep]
    )

    // ── Render ──────────────────────────────────────────────────

    const selectedStep = workflowSteps.find((s) => s.id === selectedStepId) ?? null

    return (
        <div
            className="flex flex-col rounded-2xl border overflow-hidden"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface))",
                height: "calc(100vh - 200px)",
                minHeight: "500px",
            }}
        >
            {/* Main content area — relative for drawer overlay */}
            <div className="flex flex-1 overflow-hidden relative">
                <StudioSidebar
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    onAssistantToggle={() => setAssistantOpen((o) => !o)}
                    assistantOpen={assistantOpen}
                />

                <StudioWorkspace
                    activeCategory={activeCategory}
                    onToolSelect={handleToolSelect}
                    onToolRunNow={handleToolRunNow}
                />

                <StudioAdvisor
                    open={assistantOpen}
                    onClose={() => setAssistantOpen(false)}
                    projectId={projectId}
                />

                {/* Session drawer — overlays workspace when a step is selected */}
                {selectedStep && (
                    <StepSessionDrawer
                        step={selectedStep}
                        onClose={() => setSelectedStepId(null)}
                        onSendMessage={handleSendMessage}
                        onStop={handleStopStep}
                    />
                )}
            </div>

            <WorkflowTimeline
                steps={workflowSteps}
                selectedStepId={selectedStepId}
                onRemoveStep={handleRemoveStep}
                onStepClick={handleStepClick}
                onRunAll={handleRunAll}
                onClearTimeline={handleClearTimeline}
            />
        </div>
    )
}
