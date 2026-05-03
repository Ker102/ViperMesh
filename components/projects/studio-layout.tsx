"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { StudioSidebar } from "./studio-sidebar"
import { StudioWorkspace } from "./studio-workspace"
import { StudioAdvisor } from "./studio-advisor"
import { WorkflowTimeline, type WorkflowTimelineStep, type StepMonitoringLog, type StepPlanData, type StepCommandResult } from "./workflow-timeline"
import { StepSessionDrawer } from "./step-session-drawer"
import { GeneratedAssetsShelf, type AssetLibraryMetadataPatch } from "./generated-assets-shelf"
import { SavedAssetThumbnailGenerator } from "./saved-asset-thumbnail-generator"
import { extractGeneratedAssets, type GeneratedAssetItem } from "./generated-assets"
import type { ToolEntry } from "@/lib/orchestration/tool-catalog"
import { getToolById } from "@/lib/orchestration/tool-catalog"
import type { AgentStreamEvent } from "@/lib/orchestration/types"

interface StudioLayoutProps {
    projectId: string
}

type NeuralStepPatch = Partial<Pick<WorkflowTimelineStep, "status" | "error" | "inputs" | "neuralState">>
type LibraryImportStatus = {
    fileName: string
    loadedBytes: number
    totalBytes: number
    phase: "uploading" | "processing"
} | null

const MODEL_EXTENSION_PATTERN = /\.(glb|gltf|fbx|obj|stl)$/i

function isModelAssetUrl(viewerUrl?: string | null, filenameHint?: string | null) {
    if (!viewerUrl) return false

    try {
        const baseUrl =
            typeof window !== "undefined"
                ? window.location.origin
                : "http://127.0.0.1"
        const parsed = new URL(viewerUrl, baseUrl)
        const decodedPathname = decodeURIComponent(parsed.pathname)
        const filename = parsed.searchParams.get("filename")

        return (
            MODEL_EXTENSION_PATTERN.test(decodedPathname) ||
            MODEL_EXTENSION_PATTERN.test(filename ?? "") ||
            MODEL_EXTENSION_PATTERN.test(filenameHint ?? "")
        )
    } catch {
        return MODEL_EXTENSION_PATTERN.test(filenameHint ?? "")
    }
}

function getToolInputKeyByType(toolId: string, type: "mesh" | "image"): string | null {
    const tool = getToolById(toolId)
    return tool?.inputs.find((input) => input.type === type)?.key ?? null
}

// ── API persistence helpers (replaces localStorage) ─────────────
type PersistedStepsLoadResult =
    | { ok: true; steps: WorkflowTimelineStep[] }
    | { ok: false; steps: WorkflowTimelineStep[]; error: unknown }

async function fetchPersistedSteps(projectId: string): Promise<PersistedStepsLoadResult> {
    try {
        const res = await fetch(`/api/projects/studio-session?projectId=${projectId}`)
        if (!res.ok) {
            return {
                ok: false,
                steps: [],
                error: new Error(`Failed to load studio session: HTTP ${res.status}`),
            }
        }
        const data = await res.json()
        const steps = data.steps as WorkflowTimelineStep[] | undefined
        if (!Array.isArray(steps)) return { ok: true, steps: [] }
        // Steps that were "running" when the page closed can't be resumed — mark as failed
        return {
            ok: true,
            steps: steps.map((step) =>
                step.status === "running"
                    ? { ...step, status: "failed" as const, error: step.error ?? "Session interrupted" }
                    : step
            ),
        }
    } catch (error) {
        return { ok: false, steps: [], error }
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

async function fetchSavedAssets(projectId: string): Promise<GeneratedAssetItem[]> {
    try {
        const res = await fetch(`/api/projects/assets?projectId=${projectId}`)
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data.assets) ? data.assets as GeneratedAssetItem[] : []
    } catch (err) {
        console.warn("[StudioLayout] Failed to fetch saved assets:", err)
        return []
    }
}

function upsertAsset(items: GeneratedAssetItem[], nextAsset: GeneratedAssetItem): GeneratedAssetItem[] {
    const existingIndex = items.findIndex((item) => item.id === nextAsset.id)
    if (existingIndex === -1) {
        return [nextAsset, ...items]
    }

    const next = [...items]
    next[existingIndex] = nextAsset
    return next
}

function getSavedAssetId(asset: GeneratedAssetItem): string | null {
    return asset.id.startsWith("saved:") ? asset.id.slice("saved:".length) : null
}

function uploadLibraryAssetWithProgress({
    projectId,
    file,
    signal,
    onProgress,
}: {
    projectId: string
    file: File
    signal: AbortSignal
    onProgress: (loadedBytes: number, totalBytes: number) => void
}): Promise<GeneratedAssetItem> {
    return new Promise((resolve, reject) => {
        const formData = new FormData()
        formData.append("projectId", projectId)
        formData.append("file", file)

        const request = new XMLHttpRequest()
        request.open("POST", "/api/projects/assets/import")

        request.upload.onprogress = (event) => {
            onProgress(event.loaded, event.lengthComputable ? event.total : file.size)
        }

        request.onload = () => {
            let payload: { asset?: GeneratedAssetItem; error?: string } | null = null
            try {
                payload = request.responseText ? JSON.parse(request.responseText) as { asset?: GeneratedAssetItem; error?: string } : null
            } catch {
                payload = null
            }

            if (request.status >= 200 && request.status < 300 && payload?.asset) {
                resolve(payload.asset)
                return
            }

            reject(new Error(payload?.error ?? `Import failed with HTTP ${request.status}`))
        }

        request.onerror = () => reject(new Error("Import upload failed. Check the connection and try again."))
        request.onabort = () => reject(new Error("Import cancelled."))

        const abortUpload = () => request.abort()
        signal.addEventListener("abort", abortUpload, { once: true })
        request.onloadend = () => signal.removeEventListener("abort", abortUpload)

        request.send(formData)
    })
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
    const [librarySelectionMode, setLibrarySelectionMode] = useState<{
        token: string
        label: string
    } | null>(null)
    const [librarySelectionEvent, setLibrarySelectionEvent] = useState<{
        token: string
        asset: GeneratedAssetItem
    } | null>(null)
    const [libraryImportInFlight, setLibraryImportInFlight] = useState(false)
    const [libraryImportStatus, setLibraryImportStatus] = useState<LibraryImportStatus>(null)
    const [savedAssets, setSavedAssets] = useState<GeneratedAssetItem[]>([])
    const [thumbnailRetryKey, setThumbnailRetryKey] = useState(0)
    const libraryImportControllerRef = useRef<AbortController | null>(null)

    // Keep ref in sync with state
    useEffect(() => {
        workflowStepsRef.current = workflowSteps
    }, [workflowSteps])

    // ── Load steps from API on mount ─────────────────────────────
    useEffect(() => {
        let cancelled = false
        fetchPersistedSteps(projectId).then((result) => {
            if (!cancelled) {
                if (!result.ok) {
                    console.warn("[StudioLayout] Failed to load persisted steps; skipping session autosave to avoid overwriting existing pipeline.", result.error)
                    setStepsLoading(false)
                    return
                }

                const steps = result.steps
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

    useEffect(() => {
        let cancelled = false
        fetchSavedAssets(projectId).then((assets) => {
            if (!cancelled) {
                setSavedAssets(assets)
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

    useEffect(() => {
        if (typeof window === "undefined") return
        if (selectedStepId) {
            window.sessionStorage.setItem(selectedStepStorageKey, selectedStepId)
        } else {
            window.sessionStorage.removeItem(selectedStepStorageKey)
        }
    }, [selectedStepId, selectedStepStorageKey])

    const sessionGeneratedAssets = useMemo<GeneratedAssetItem[]>(
        () => extractGeneratedAssets(workflowSteps),
        [workflowSteps]
    )
    const generatedAssets = useMemo<GeneratedAssetItem[]>(() => {
        const savedSourceStepIds = new Set(
            savedAssets
                .map((asset) => asset.stepId)
                .filter((stepId) => !stepId.startsWith("saved:")),
        )
        const savedViewerUrls = new Set(savedAssets.map((asset) => asset.viewerUrl))
        const unsavedSessionAssets = sessionGeneratedAssets.filter((asset) =>
            !savedSourceStepIds.has(asset.stepId) &&
            !savedViewerUrls.has(asset.viewerUrl)
        )
        return [...savedAssets, ...unsavedSessionAssets]
    }, [savedAssets, sessionGeneratedAssets])

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

    const ensureAssetStep = useCallback((asset: GeneratedAssetItem): WorkflowTimelineStep => {
        const existing = workflowStepsRef.current.find((item) => item.id === asset.stepId)
        const nextStep: WorkflowTimelineStep = {
            ...(existing ?? {}),
            id: asset.stepId,
            title: asset.viewerLabel ?? asset.title,
            toolName: asset.toolName,
            status: existing?.status ?? "done",
            hiddenFromTimeline: true,
            inputs: { ...(existing?.inputs ?? {}), viewerUrl: asset.viewerUrl },
            neuralState: {
                ...(existing?.neuralState ?? {}),
                viewerUrl: asset.viewerUrl,
                viewerLabel: asset.viewerLabel ?? asset.title,
                viewerSource: "input",
                assetOrigin: asset.librarySource === "generated" ? "generated" : "imported",
                assetStats: asset.assetStats ?? null,
            },
        }

        setWorkflowSteps((prev) => {
            const existingIndex = prev.findIndex((step) => step.id === nextStep.id)
            if (existingIndex === -1) {
                return [...prev, nextStep]
            }

            const current = prev[existingIndex]
            if (
                current.neuralState?.viewerUrl === nextStep.neuralState?.viewerUrl &&
                current.title === nextStep.title &&
                current.toolName === nextStep.toolName
            ) {
                return prev
            }

            const next = [...prev]
            next[existingIndex] = nextStep
            return next
        })
        return nextStep
    }, [])

    const handleOpenGeneratedAsset = useCallback((asset: GeneratedAssetItem, options?: { attachToActiveTool?: boolean }) => {
        const step = ensureAssetStep(asset)
        const stepId = step.id
        const tool = step ? getToolById(step.toolName) : undefined
        if (tool) {
            setActiveCategory(tool.category)
        }
        if (
            options?.attachToActiveTool &&
            librarySelectionMode &&
            isModelAssetUrl(asset.viewerUrl, asset.viewerLabel ?? asset.title)
        ) {
            setLibrarySelectionEvent({
                token: librarySelectionMode.token,
                asset,
            })
        } else {
            setLibrarySelectionEvent(null)
        }
        setSelectedStepId(stepId)
        setGeneratedAssetsOpen(false)
        setAssistantOpen(false)
        setLibrarySelectionMode(null)
    }, [ensureAssetStep, librarySelectionMode])

    const handleRequestLibrarySelection = useCallback((selection: { token: string; label: string }) => {
        setLibrarySelectionMode(selection)
        setGeneratedAssetsOpen(true)
        setAssistantOpen(false)
    }, [])

    const handleUseLibraryAsset = useCallback((asset: GeneratedAssetItem) => {
        if (!librarySelectionMode) return
        setLibrarySelectionEvent({
            token: librarySelectionMode.token,
            asset,
        })
    }, [librarySelectionMode])

    const handleConsumeLibrarySelection = useCallback((token: string) => {
        setLibrarySelectionEvent((current) => (current?.token === token ? null : current))
        setLibrarySelectionMode((current) => (current?.token === token ? null : current))
    }, [])

    const handleContinueGeneratedAssetToTool = useCallback((asset: GeneratedAssetItem, toolId: string) => {
        const targetTool = getToolById(toolId)
        if (!targetTool) return

        const launchInputs: Record<string, string> = {}
        const meshInputKey = getToolInputKeyByType(targetTool.id, "mesh")
        const imageInputKey = getToolInputKeyByType(targetTool.id, "image")

        if (meshInputKey) {
            launchInputs[meshInputKey] = asset.viewerUrl
        }
        if (asset.referenceImage && imageInputKey) {
            launchInputs[imageInputKey] = asset.referenceImage
        }

        setSelectedStepId(null)
        setAssistantOpen(false)
        setGeneratedAssetsOpen(false)
        setLibrarySelectionMode(null)
        setLibrarySelectionEvent(null)
        setActiveCategory(targetTool.category)
        setExternalToolLaunch({
            token: `${asset.stepId}:${Date.now()}`,
            toolId: targetTool.id,
            inputs: launchInputs,
        })
    }, [])

    const handleImportLibraryAsset = useCallback(async (file: File) => {
        libraryImportControllerRef.current?.abort()
        const controller = new AbortController()
        libraryImportControllerRef.current = controller
        setLibraryImportInFlight(true)
        setLibraryImportStatus({
            fileName: file.name,
            loadedBytes: 0,
            totalBytes: file.size,
            phase: "uploading",
        })
        try {
            const asset = await uploadLibraryAssetWithProgress({
                projectId,
                file,
                signal: controller.signal,
                onProgress: (loadedBytes, totalBytes) => {
                    setLibraryImportStatus({
                        fileName: file.name,
                        loadedBytes,
                        totalBytes,
                        phase: totalBytes > 0 && loadedBytes >= totalBytes ? "processing" : "uploading",
                    })
                },
            })
            setSavedAssets((current) => upsertAsset(current, asset))
            const importedStep: WorkflowTimelineStep = {
                id: asset.stepId,
                title: asset.title,
                toolName: asset.toolName,
                status: "done",
                hiddenFromTimeline: true,
                inputs: { viewerUrl: asset.viewerUrl },
                neuralState: {
                    viewerUrl: asset.viewerUrl,
                    viewerLabel: asset.viewerLabel,
                    viewerSource: "input",
                    assetOrigin: "imported",
                    assetStats: asset.assetStats ?? null,
                },
            }

            setWorkflowSteps((prev) => {
                const withoutExisting = prev.filter((step) => step.id !== importedStep.id)
                return [...withoutExisting, importedStep]
            })

            if (librarySelectionMode) {
                setLibrarySelectionEvent({
                    token: librarySelectionMode.token,
                    asset,
                })
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to import model"
            if (message !== "Import cancelled.") {
                window.alert(message)
            }
        } finally {
            if (libraryImportControllerRef.current === controller) {
                libraryImportControllerRef.current = null
                setLibraryImportInFlight(false)
                setLibraryImportStatus(null)
            }
        }
    }, [librarySelectionMode, projectId])

    const handleCancelLibraryImport = useCallback(() => {
        libraryImportControllerRef.current?.abort()
    }, [])

    const handleSaveLibraryAsset = useCallback(async (asset: GeneratedAssetItem) => {
        const savedAssetId = getSavedAssetId(asset)
        if (savedAssetId) {
            return
        }

        try {
            const response = await fetch("/api/projects/assets/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    sourceStepId: asset.stepId,
                    label: asset.viewerLabel ?? asset.title,
                    viewerUrl: asset.viewerUrl,
                    assetStats: asset.assetStats ?? undefined,
                    isPinned: true,
                }),
            })
            const payload = await response.json().catch(() => null)
            if (!response.ok || !payload?.asset) {
                throw new Error(payload?.error ?? `Save failed with HTTP ${response.status}`)
            }
            setSavedAssets((current) => upsertAsset(current, payload.asset as GeneratedAssetItem))
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save asset"
            window.alert(message)
        }
    }, [projectId])

    const handleSetLibraryAssetPinned = useCallback(async (asset: GeneratedAssetItem, isPinned: boolean) => {
        const savedAssetId = getSavedAssetId(asset)
        if (!savedAssetId) {
            if (isPinned) {
                await handleSaveLibraryAsset(asset)
            }
            return
        }

        try {
            const response = await fetch(`/api/projects/assets/${savedAssetId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned }),
            })
            const payload = await response.json().catch(() => null)
            if (!response.ok || !payload?.asset) {
                throw new Error(payload?.error ?? `Pin update failed with HTTP ${response.status}`)
            }
            setSavedAssets((current) => upsertAsset(current, payload.asset as GeneratedAssetItem))
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update asset pin"
            window.alert(message)
        }
    }, [handleSaveLibraryAsset])

    const handleToggleLibraryAssetPinned = useCallback(async (asset: GeneratedAssetItem) => {
        await handleSetLibraryAssetPinned(asset, !asset.isPinned)
    }, [handleSetLibraryAssetPinned])

    const handleUpdateLibraryAsset = useCallback(async (asset: GeneratedAssetItem, patch: AssetLibraryMetadataPatch) => {
        const savedAssetId = getSavedAssetId(asset)
        if (!savedAssetId) {
            window.alert("Save this asset to the library before editing metadata.")
            return
        }

        try {
            const response = await fetch(`/api/projects/assets/${savedAssetId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            })
            const payload = await response.json().catch(() => null)
            if (!response.ok || !payload?.asset) {
                throw new Error(payload?.error ?? `Asset update failed with HTTP ${response.status}`)
            }
            setSavedAssets((current) => upsertAsset(current, payload.asset as GeneratedAssetItem))
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update asset metadata"
            window.alert(message)
            throw error
        }
    }, [])

    const handleDeleteLibraryAsset = useCallback(async (asset: GeneratedAssetItem) => {
        const savedAssetId = getSavedAssetId(asset)
        if (!savedAssetId) {
            return
        }

        try {
            const response = await fetch(`/api/projects/assets/${savedAssetId}`, {
                method: "DELETE",
            })
            const payload = await response.json().catch(() => null)
            if (!response.ok) {
                throw new Error(payload?.error ?? `Asset removal failed with HTTP ${response.status}`)
            }
            setSavedAssets((current) => current.filter((item) => item.id !== asset.id))
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to remove asset"
            window.alert(message)
            throw error
        }
    }, [])

    const handleRetryLibraryAssetThumbnail = useCallback((asset: GeneratedAssetItem) => {
        const savedAssetId = getSavedAssetId(asset)
        if (!savedAssetId) return

        setSavedAssets((current) => current.map((item) => {
            if (item.id !== asset.id) return item
            return {
                ...item,
                previewImageUrl: undefined,
                assetStats: {
                    ...(item.assetStats ?? {}),
                    thumbnailVersion: undefined,
                    thumbnailStatus: "queued",
                    thumbnailError: undefined,
                },
            }
        }))
        setThumbnailRetryKey((key) => key + 1)
    }, [])

    const handleThumbnailStatusChange = useCallback((
        asset: GeneratedAssetItem,
        status: "queued" | "rendering" | "ready" | "failed",
        error?: string,
    ) => {
        setSavedAssets((current) => current.map((item) => {
            if (item.id !== asset.id) return item
            return {
                ...item,
                assetStats: {
                    ...(item.assetStats ?? {}),
                    thumbnailStatus: status,
                    thumbnailError: status === "failed" ? error : undefined,
                },
            }
        }))
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
    const selectedNeuralStep = selectedStep &&
        (selectedStepTool?.type === "neural" || selectedStep.neuralState?.assetOrigin === "imported")
        ? selectedStep
        : null

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
                    onAssistantToggle={() => {
                        setAssistantOpen((o) => !o)
                        setGeneratedAssetsOpen(false)
                    }}
                    assistantOpen={assistantOpen}
                />

                <StudioWorkspace
                    activeCategory={activeCategory}
                    onToolSelect={handleToolSelect}
                    onToolRunNow={handleToolRunNow}
                    onNeuralRunStart={handleNeuralRunStart}
                    onNeuralRunUpdate={handleNeuralRunUpdate}
                    selectedPipelineStep={selectedNeuralStep}
                    onRequestCategoryChange={setActiveCategory}
                    onOpenAssetLibrary={() => {
                        setGeneratedAssetsOpen(true)
                        setAssistantOpen(false)
                    }}
                    onRequestLibrarySelection={handleRequestLibrarySelection}
                    incomingLibrarySelection={librarySelectionEvent}
                    onConsumeLibrarySelection={handleConsumeLibrarySelection}
                    externalToolLaunch={externalToolLaunch}
                    generatedAssets={generatedAssets}
                />

                <button
                    type="button"
                    onClick={() => {
                        setGeneratedAssetsOpen((open) => !open)
                        setAssistantOpen(false)
                    }}
                    className="absolute bottom-1/2 right-0 z-30 inline-flex h-16 w-7 translate-x-0 translate-y-1/2 items-center justify-center rounded-l-2xl border border-r-0 transition-all duration-300 ease-out hover:w-8 hover:shadow-xl active:scale-95 motion-reduce:transition-none"
                    style={{
                        right: generatedAssetsOpen ? "320px" : "0px",
                        borderColor: "hsl(var(--forge-border))",
                        backgroundColor: "hsl(var(--forge-surface))",
                        color: "hsl(var(--forge-text-muted))",
                        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                    }}
                    aria-label={generatedAssetsOpen ? "Collapse asset library" : "Open asset library"}
                    title={generatedAssetsOpen ? "Collapse asset library" : "Open asset library"}
                >
                    {generatedAssetsOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    {generatedAssets.length > 0 && !generatedAssetsOpen && (
                        <span
                            className="absolute -left-2 -top-2 min-w-[18px] rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                            style={{
                                backgroundColor: "hsl(var(--forge-accent))",
                                color: "white",
                            }}
                        >
                            {generatedAssets.length > 9 ? "9+" : generatedAssets.length}
                        </span>
                    )}
                </button>

                <GeneratedAssetsShelf
                    open={generatedAssetsOpen}
                    assets={generatedAssets}
                    onOpenAsset={handleOpenGeneratedAsset}
                    onContinueToTool={handleContinueGeneratedAssetToTool}
                    onUseAsset={handleUseLibraryAsset}
                    onImportAsset={handleImportLibraryAsset}
                    onSaveAsset={handleSaveLibraryAsset}
                    onUpdateAsset={handleUpdateLibraryAsset}
                    onDeleteAsset={handleDeleteLibraryAsset}
                    onTogglePinned={handleToggleLibraryAssetPinned}
                    onSetPinned={handleSetLibraryAssetPinned}
                    onRetryThumbnail={handleRetryLibraryAssetThumbnail}
                    selectionMode={librarySelectionMode}
                    importInFlight={libraryImportInFlight}
                    importStatus={libraryImportStatus}
                    onCancelImport={handleCancelLibraryImport}
                />

                <SavedAssetThumbnailGenerator
                    key={thumbnailRetryKey}
                    assets={savedAssets}
                    onThumbnailSaved={(asset) => {
                        setSavedAssets((current) => upsertAsset(current, asset))
                    }}
                    onThumbnailStatusChange={handleThumbnailStatusChange}
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
