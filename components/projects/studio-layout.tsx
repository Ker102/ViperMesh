"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { StudioSidebar } from "./studio-sidebar"
import { StudioWorkspace } from "./studio-workspace"
import { StudioAdvisor } from "./studio-advisor"
import { WorkflowTimeline, type WorkflowTimelineStep, type StepMonitoringLog, type StepPlanData, type StepCommandResult } from "./workflow-timeline"
import { StepSessionDrawer } from "./step-session-drawer"
import { GeneratedAssetsShelf } from "./generated-assets-shelf"
import { extractGeneratedAssets, type GeneratedAssetItem } from "./generated-assets"
import type { ToolEntry } from "@/lib/orchestration/tool-catalog"
import { getToolById } from "@/lib/orchestration/tool-catalog"
import type { AgentStreamEvent } from "@/lib/orchestration/types"

interface StudioLayoutProps {
    projectId: string
}

type NeuralStepPatch = Partial<Pick<WorkflowTimelineStep, "status" | "error" | "inputs" | "neuralState">>

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
        // Strip monitoring logs and base64 image data before saving to keep payload reasonable
        const slim = steps.map(({ monitoringLogs, ...rest }) => {
            const sanitizeInputs = (inputs?: Record<string, string>) => {
                if (!inputs) return inputs
                const cleanInputs = { ...inputs }
                for (const key of Object.keys(cleanInputs)) {
                    if (cleanInputs[key]?.startsWith("data:image/")) {
                        cleanInputs[key] = "[image attached]"
                    }
                }
                return cleanInputs
            }

            return {
                ...rest,
                inputs: sanitizeInputs(rest.inputs),
                neuralState: rest.neuralState
                    ? {
                        ...rest.neuralState,
                        draftInputs: sanitizeInputs(rest.neuralState.draftInputs),
                    }
                    : rest.neuralState,
            }
        })
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
    const [generatedAssetsOpen, setGeneratedAssetsOpen] = useState(false)
    const [assistantOpen, setAssistantOpen] = useState(false)
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowTimelineStep[]>([])
    const workflowStepsRef = useRef<WorkflowTimelineStep[]>(workflowSteps)
    const [stepsLoading, setStepsLoading] = useState(true)
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const initialLoadDone = useRef(false)
    const selectedStepStorageKey = `studio-selected-step:${projectId}`
    const [externalToolLaunch, setExternalToolLaunch] = useState<{
        token: string
        toolId: string
        inputs: Record<string, string>
    } | null>(null)

    // Keep ref in sync with state
    useEffect(() => {
        workflowStepsRef.current = workflowSteps
    }, [workflowSteps])

    // ── Load steps from API on mount ─────────────────────────────
    useEffect(() => {
        let cancelled = false
        fetchPersistedSteps(projectId).then((steps) => {
            if (!cancelled) {
                setWorkflowSteps(steps)
                if (typeof window !== "undefined") {
                    const restoredSelectedStepId = window.sessionStorage.getItem(selectedStepStorageKey)
                    if (restoredSelectedStepId && steps.some((step) => step.id === restoredSelectedStepId)) {
                        setSelectedStepId(restoredSelectedStepId)
                        const restoredStep = steps.find((step) => step.id === restoredSelectedStepId)
                        const restoredTool = restoredStep ? getToolById(restoredStep.toolName) : undefined
                        if (restoredTool) {
                            setActiveCategory(restoredTool.category)
                        }
                    } else if (restoredSelectedStepId) {
                        window.sessionStorage.removeItem(selectedStepStorageKey)
                    }
                }
                setStepsLoading(false)
                initialLoadDone.current = true
            }
        })
        return () => { cancelled = true }
    }, [projectId, selectedStepStorageKey])

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

    useEffect(() => {
        if (typeof window === "undefined") return
        if (selectedStepId) {
            window.sessionStorage.setItem(selectedStepStorageKey, selectedStepId)
        } else {
            window.sessionStorage.removeItem(selectedStepStorageKey)
        }
    }, [selectedStepId, selectedStepStorageKey])

    const generatedAssets = useMemo<GeneratedAssetItem[]>(
        () => extractGeneratedAssets(workflowSteps),
        [workflowSteps]
    )

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

    const appendCommandResult = useCallback(
        (stepId: string, cmd: StepCommandResult) => {
            setWorkflowSteps((prev) =>
                prev.map((s) => {
                    if (s.id !== stepId) return s
                    const existing = s.commandResults ?? []
                    // Update if same tool id exists (started → completed), else append
                    const idx = existing.findIndex((c) => c.id === cmd.id)
                    if (idx >= 0) {
                        const updated = [...existing]
                        updated[idx] = cmd
                        return { ...s, commandResults: updated }
                    }
                    return { ...s, commandResults: [...existing, cmd] }
                })
            )
        },
        []
    )

    const appendAgentEvent = useCallback(
        (stepId: string, event: AgentStreamEvent) => {
            setWorkflowSteps((prev) =>
                prev.map((s) =>
                    s.id === stepId
                        ? { ...s, agentEvents: [...(s.agentEvents ?? []), event] }
                        : s
                )
            )
        },
        []
    )

    // ── Execute a step via the chat API ─────────────────────────

    const executeStep = useCallback(
        async (stepId: string, message: string, conversationId?: string, attachments?: Array<{ id: string; name: string; type: string; size: number; data: string }>) => {
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
                const payload: Record<string, unknown> = {
                    projectId,
                    conversationId: streamConversationId,
                    message,
                    // Studio step execution: skip text streaming + strategy classification
                    // (the user already chose the tool, we just need the agent to execute it)
                    workflowMode: "studio",
                    studioStep: true,
                }
                if (attachments && attachments.length > 0) {
                    payload.attachments = attachments
                }

                const res = await fetch("/api/ai/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
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

                                // If live tool call results were already streamed in,
                                // don't overwrite them with the batch from commandSuggestions.
                                // Only use batch results if no live results exist.
                                const patch: Partial<WorkflowTimelineStep> = {
                                    status: "done" as const,
                                    planData,
                                }

                                // Check if we already have live-streamed results
                                const currentStep = workflowStepsRef.current.find((s) => s.id === stepId)
                                const hasLiveResults = (currentStep?.commandResults ?? []).length > 0

                                if (!hasLiveResults && commandResults.length > 0) {
                                    patch.commandResults = commandResults
                                }

                                updateStep(stepId, patch)
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
                                            } else if (eventType === "agent:tool_call") {
                                                // Live tool call streaming — only show after completion/failure
                                                const toolName = typeof event.toolName === "string" ? event.toolName : "unknown"
                                                const status = typeof event.status === "string" ? event.status : "started"

                                                // Only add to commandResults when tool is done (skip "started")
                                                if (status === "completed" || status === "failed") {
                                                    appendCommandResult(stepId, {
                                                        id: `tc-${toolName}-${Date.now()}`,
                                                        tool: toolName,
                                                        status: status === "completed" ? "executed" : "failed",
                                                    })
                                                }
                                                // Also push to agentEvents for AgentActivity component
                                                appendAgentEvent(stepId, event as unknown as AgentStreamEvent)
                                            } else if (eventType === "agent:planning_start") {
                                                appendAgentEvent(stepId, event as unknown as AgentStreamEvent)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [projectId, updateStep, appendMessage, appendMonitoringLog, updateAssistantContent, appendCommandResult, appendAgentEvent]
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
        const pendingSteps = workflowStepsRef.current.filter((s) => s.status === "pending")
        if (pendingSteps.length === 0) return

        // Run first pending step — subsequent steps can be chained later
        const first = pendingSteps[0]
        const prompt = first.inputs?.prompt ?? first.title
        setSelectedStepId(first.id)
        executeStep(first.id, prompt)
    }, [executeStep])

    const handleClearTimeline = useCallback(() => {
        abortControllerRef.current?.abort()
        setWorkflowSteps([])
        setSelectedStepId(null)
        setGeneratedAssetsOpen(false)
        if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(selectedStepStorageKey)
        }
        deletePersistedSteps(projectId)
    }, [projectId, selectedStepStorageKey])

    const handleOpenGeneratedAsset = useCallback((stepId: string) => {
        const step = workflowStepsRef.current.find((item) => item.id === stepId)
        const tool = step ? getToolById(step.toolName) : undefined
        if (tool) {
            setActiveCategory(tool.category)
        }
        setSelectedStepId(stepId)
        setGeneratedAssetsOpen(false)
        setAssistantOpen(false)
    }, [])

    const handleContinueGeneratedAssetToPaint = useCallback((asset: GeneratedAssetItem) => {
        const paintTool = getToolById("hunyuan-paint")
        if (!paintTool) return

        setSelectedStepId(null)
        setAssistantOpen(false)
        setGeneratedAssetsOpen(false)
        setActiveCategory(paintTool.category)
        setExternalToolLaunch({
            token: `${asset.stepId}:${Date.now()}`,
            toolId: paintTool.id,
            inputs: {
                meshUrl: asset.viewerUrl,
                ...(asset.referenceImage ? { imageUrl: asset.referenceImage } : {}),
            },
        })
    }, [])

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

            // Extract image inputs as attachments
            const attachments: Array<{ id: string; name: string; type: string; size: number; data: string }> = []
            for (const inp of tool.inputs ?? []) {
                if (inp.type === "image" && inputs[inp.key]) {
                    const dataUrl = inputs[inp.key]
                    // Extract mime type from data URL (e.g. data:image/png;base64,...)
                    const mimeMatch = dataUrl.match(/^data:(image\/[^;]+);/)
                    const mimeType = mimeMatch?.[1] ?? "image/png"
                    attachments.push({
                        id: `img-${Date.now()}`,
                        name: `reference.${mimeType.split("/")[1] ?? "png"}`,
                        type: mimeType,
                        size: Math.round(dataUrl.length * 0.75), // approximate decoded size
                        data: dataUrl,
                    })
                }
            }

            // Execute immediately
            const prompt = inputs.prompt ?? inputs.description ?? `Run ${tool.name}`
            executeStep(stepId, prompt, undefined, attachments.length > 0 ? attachments : undefined)
        },
        [executeStep]
    )

    const handleNeuralRunStart = useCallback(
        (tool: ToolEntry, inputs: Record<string, string>, existingStepId?: string) => {
            if (existingStepId) {
                setWorkflowSteps((prev) =>
                    prev.map((step) =>
                        step.id === existingStepId
                            ? {
                                ...step,
                                title: tool.name,
                                toolName: tool.id,
                                status: "running" as const,
                                inputs,
                                error: undefined,
                            }
                            : step
                    )
                )
                return existingStepId
            }

            const stepId = `neural-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            const step: WorkflowTimelineStep = {
                id: stepId,
                title: tool.name,
                toolName: tool.id,
                status: "running",
                inputs,
            }
            setWorkflowSteps((prev) => [...prev, step])
            return stepId
        },
        []
    )

    const handleNeuralRunUpdate = useCallback(
        (stepId: string, patch: NeuralStepPatch) => {
            updateStep(stepId, patch)
        },
        [updateStep]
    )

    const handleStepClick = useCallback((stepId: string) => {
        const step = workflowStepsRef.current.find((item) => item.id === stepId)
        const tool = step ? getToolById(step.toolName) : undefined
        if (tool) {
            setActiveCategory(tool.category)
        }
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
        (stepId: string, message: string, attachments?: Array<{ id: string; name: string; type: string; size: number; data: string }>) => {
            const step = workflowSteps.find((s) => s.id === stepId)
            if (!step) return
            executeStep(stepId, message, step.conversationId, attachments)
        },
        [workflowSteps, executeStep]
    )

    // ── Render ──────────────────────────────────────────────────

    const selectedStep = workflowSteps.find((s) => s.id === selectedStepId) ?? null
    const selectedStepTool = selectedStep ? getToolById(selectedStep.toolName) : undefined
    const selectedNeuralStep = selectedStep && selectedStepTool?.type === "neural" ? selectedStep : null

    return (
        <div
            className="flex min-h-[700px] flex-col overflow-hidden rounded-[28px] border xl:min-h-[960px]"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface))",
                height: "clamp(700px, calc(100vh - 48px), 1280px)",
            }}
        >
            {/* Main content area — relative for drawer overlay */}
            <div className="flex flex-1 overflow-hidden relative">
                <StudioSidebar
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    onGeneratedAssetsToggle={() => {
                        setGeneratedAssetsOpen((open) => !open)
                        setAssistantOpen(false)
                    }}
                    generatedAssetsOpen={generatedAssetsOpen}
                    generatedAssetCount={generatedAssets.length}
                    onAssistantToggle={() => {
                        setAssistantOpen((o) => !o)
                        setGeneratedAssetsOpen(false)
                    }}
                    assistantOpen={assistantOpen}
                />

                <GeneratedAssetsShelf
                    open={generatedAssetsOpen}
                    assets={generatedAssets}
                    onClose={() => setGeneratedAssetsOpen(false)}
                    onOpenAsset={handleOpenGeneratedAsset}
                    onContinueToPaint={handleContinueGeneratedAssetToPaint}
                />

                <StudioWorkspace
                    activeCategory={activeCategory}
                    onToolSelect={handleToolSelect}
                    onToolRunNow={handleToolRunNow}
                    onNeuralRunStart={handleNeuralRunStart}
                    onNeuralRunUpdate={handleNeuralRunUpdate}
                    selectedPipelineStep={selectedNeuralStep}
                    onRequestCategoryChange={setActiveCategory}
                    externalToolLaunch={externalToolLaunch}
                />

                <StudioAdvisor
                    open={assistantOpen}
                    onClose={() => setAssistantOpen(false)}
                    projectId={projectId}
                />

                {/* Session drawer — overlays workspace when a step is selected */}
                {selectedStep && !selectedNeuralStep && (
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
