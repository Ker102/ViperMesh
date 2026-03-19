"use client"

import { useEffect, useMemo, useRef, useState, useCallback, type ChangeEvent } from "react"
import { Square } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PlanStep, PlanningMetadata, AgentStreamEvent } from "@/lib/orchestration/types"
import type { UsageSummary } from "@/lib/usage"
import { parsePlanningMetadata } from "@/lib/orchestration/plan-utils"
import { ImagePlus, X } from "lucide-react"
import { WorkflowPanel } from "@/components/projects/workflow-panel"
import type { WorkflowProposal } from "@/lib/orchestration/workflow-types"
import { ModeSelector, type WorkflowMode } from "@/components/projects/mode-selector"
import { StudioLayout } from "@/components/projects/studio-layout"
import { CastleIcon, FoxIcon, RocketIcon, TreeIcon } from "@/components/projects/studio-icons"
import { MonitoringPanel } from "@/components/projects/monitoring-panel"

interface CommandStub {
  id: string
  tool: string
  description: string
  status: "pending" | "ready" | "executed" | "failed"
  confidence: number
  arguments?: Record<string, unknown>
  notes?: string
  result?: unknown
  error?: string
}

interface ChatMessage {
  id?: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
  mcpCommands?: CommandStub[]
  plan?: PlanningMetadata
  attachments?: ChatAttachment[]
}

type ConversationHistoryItem = {
  id: string
  lastMessageAt: string
  preview?: string
  messages: ChatMessage[]
}

interface ChatAttachment {
  id?: string
  name: string
  type: string
  size?: number
  url?: string
  previewUrl?: string
}

interface PendingAttachment {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
  base64: string
}

interface ProjectChatProps {
  projectId: string
  initialConversation?: {
    id: string
    messages: ChatMessage[]
  } | null
  initialUsage?: UsageSummary
  conversationHistory?: ConversationHistoryItem[]
  initialAssetConfig: {
    allowHyper3d: boolean
    allowSketchfab: boolean
    allowPolyHaven: boolean
    allowWebResearch: boolean
  }
  subscriptionTier: string
  localProvider: {
    provider: string | null
    baseUrl: string | null
    model: string | null
  }
}

export function ProjectChat({
  projectId,
  initialConversation,
  initialUsage,
  conversationHistory,
  initialAssetConfig,
  subscriptionTier,
  localProvider,
}: ProjectChatProps) {
  const router = useRouter()
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversation?.id ?? null
  )
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialConversation?.messages ?? []
  )
  const [history, setHistory] = useState<ConversationHistoryItem[]>(
    conversationHistory ?? []
  )
  const [usage, setUsage] = useState<UsageSummary | undefined>(initialUsage)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRetryable, setIsRetryable] = useState(false)
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null)
  const lastTempAssistantIdRef = useRef<string | null>(null)
  const localProviderConfigured = Boolean(
    localProvider.provider && localProvider.baseUrl && localProvider.model
  )

  const isPaidTier = subscriptionTier !== "free"
  const [assetConfig, setAssetConfig] = useState(() => ({
    ...initialAssetConfig,
    allowWebResearch: isPaidTier ? initialAssetConfig.allowWebResearch : false,
  }))
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [localReady, setLocalReady] = useState<boolean>(localProviderConfigured)
  const [agentEvents, setAgentEvents] = useState<AgentStreamEvent[]>([])
  const [agentActive, setAgentActive] = useState(false)
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowProposal | null>(null)
  const [mcpConnected, setMcpConnected] = useState<boolean | null>(null)
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("autopilot")
  const abortControllerRef = useRef<AbortController | null>(null)
  // Monitoring state
  const [monitoringLogs, setMonitoringLogs] = useState<Array<{ timestamp: string; sessionId: string; namespace: string; level: "debug" | "info" | "warn" | "error"; message: string; data?: Record<string, unknown>; durationMs?: number }>>([])
  const [monitoringSummary, setMonitoringSummary] = useState<{
    sessionId: string; startedAt: string; endedAt: string; totalDurationMs: number;
    timers: Record<string, number>; counts: { debug: number; info: number; warn: number; error: number };
    neuralCosts: Array<{ provider: string; model: string; durationMs: number; estimatedCostUsd: number }>;
    ragStats: { totalRetrieved: number; totalRelevant: number; fallbacksUsed: number };
  } | null>(null)
  const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024
  const MAX_ATTACHMENTS = 4

  const providerLabel = useMemo(() => {
    if (!localProvider.provider) return "Not configured"
    switch (localProvider.provider) {
      case "ollama":
        return "Ollama"
      case "lmstudio":
        return "LM Studio"
      default:
        return localProvider.provider
    }
  }, [localProvider.provider])

  const providerEndpoint = useMemo(() => {
    if (!localProvider.baseUrl) return null
    try {
      const parsed = new URL(localProvider.baseUrl)
      return parsed.host
    } catch {
      return localProvider.baseUrl
    }
  }, [localProvider.baseUrl])

  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isSending

  const formattedUsage = useMemo(() => {
    if (!usage) return null
    return {
      daily: usage.daily.limit
        ? `${usage.daily.used} / ${usage.daily.limit}`
        : `${usage.daily.used} used`,
      monthly: usage.monthly.limit
        ? `${usage.monthly.used} / ${usage.monthly.limit}`
        : `${usage.monthly.used} used`,
    }
  }, [usage])

  useEffect(() => {
    setHistory(conversationHistory ?? [])
  }, [conversationHistory])

  useEffect(() => {
    setLocalReady(localProviderConfigured)
  }, [localProviderConfigured])

  // Poll MCP (Blender addon) connection status every 10s
  useEffect(() => {
    let cancelled = false
    const checkConnection = async () => {
      try {
        const res = await fetch("/api/mcp/status")
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setMcpConnected(data.status?.connected === true)
        } else {
          console.warn(`MCP status check failed: HTTP ${res.status}`)
          setMcpConnected(false)
        }
      } catch {
        if (!cancelled) setMcpConnected(false)
      }
    }
    checkConnection()
    const interval = setInterval(checkConnection, 10_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  useEffect(() => {
    if (initialConversation?.id && initialConversation.id !== conversationId) {
      setConversationId(initialConversation.id)
      setMessages(initialConversation.messages.map((msg) => ({ ...msg })))
      return
    }

    if (!initialConversation?.id && conversationId && history.length === 0) {
      setConversationId(null)
      setMessages([])
    }
  }, [initialConversation, conversationId, history])

  const renderStatusBadge = (status: CommandStub["status"]) => {
    const variantMap: Record<CommandStub["status"], { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      ready: { variant: "secondary", label: "Ready" },
      executed: { variant: "default", label: "Executed" },
      failed: { variant: "destructive", label: "Failed" },
    }
    const { variant, label } = variantMap[status]
    return (
      <Badge variant={variant} className="uppercase text-[10px] tracking-wide">
        {label}
      </Badge>
    )
  }

  const formatResult = (value: unknown) => {
    if (value === undefined || value === null) return null
    if (typeof value === "string") return value
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  const formatHistoryLabel = (timestamp: string) =>
    new Date(timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const resolveCommandForStep = (
    step: PlanStep,
    index: number,
    commands?: CommandStub[]
  ) => {
    if (!commands?.length) return null
    return commands[index] ?? commands.find((command) => command.tool === step.action) ?? null
  }

  const isViewingHistory = useMemo(() => {
    if (!conversationId) {
      return false
    }
    return history.some((item) => item.id === conversationId)
  }, [conversationId, history])

  function handleLoadConversation(conversation: ConversationHistoryItem) {
    setConversationId(conversation.id)
    setMessages(conversation.messages.map((msg) => ({ ...msg })))
    setError(null)
    setInput("")
    setIsSending(false)
    setAttachments([])
    setAgentEvents([])
    setAgentActive(false)
  }

  const handleAttachmentButton = () => {
    fileInputRef.current?.click()
  }

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    const remainingSlots = MAX_ATTACHMENTS - attachments.length
    if (remainingSlots <= 0) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} images per message.`)
      event.target.value = ""
      return
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots)
    const newAttachments: PendingAttachment[] = []

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are supported right now.")
        continue
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setError("Images must be 5MB or smaller.")
        continue
      }

      try {
        const dataUrl = await readFileAsDataUrl(file)
        const base64 = dataUrl.split(",")[1] ?? ""
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          base64,
        })
      } catch (fileError) {
        console.error(fileError)
        setError("Failed to read one of the files. Please try again.")
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments])
      setError(null)
    }

    event.target.value = ""
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id))
  }

  const handleProviderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    if (value === "configure") {
      router.push("/dashboard/settings#local-llm")
      return
    }
    if (!value) {
      return
    }
    if (value === localProvider.provider) {
      return
    }
    router.push(`/dashboard/settings?localProvider=${value}#local-llm`)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!canSend) return

    const trimmed = input.trim()
    const now = new Date().toISOString()
    const tempUserId = `temp-user-${Date.now()}`
    const tempAssistantId = `temp-assistant-${Date.now()}`
    const draftAttachments: ChatAttachment[] = attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
      previewUrl: attachment.dataUrl,
    }))

    setIsSending(true)
    setError(null)
    setInput("")
    setMessages((prev) => [
      ...prev,
      {
        id: tempUserId,
        role: "user",
        content: trimmed,
        createdAt: now,
        attachments: draftAttachments,
      },
      {
        id: tempAssistantId,
        role: "assistant",
        content: "",
        createdAt: now,
        mcpCommands: [],
      },
    ])
    setAttachments([])

    try {
      if (subscriptionTier === "free" && !localReady) {
        setError(
          "The free tier requires a local LLM. Configure one in Settings → Local LLM Configuration before prompting."
        )
        return
      }

      const payload: Record<string, unknown> = {
        projectId,
        conversationId: conversationId ?? undefined,
        startNew: !conversationId,
        message: trimmed,
        workflowMode,
      }

      if (subscriptionTier === "free") {
        payload.useLocalModel = true
      }

      if (attachments.length > 0) {
        payload.attachments = attachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          data: attachment.base64,
        }))
      }

      // Save payload for potential retry
      setLastPayload(payload)
      lastTempAssistantIdRef.current = tempAssistantId

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      })

      if (!response.ok || !response.body) {
        let data: Record<string, unknown> | null = null
        try {
          data = (await response.json()) as Record<string, unknown>
        } catch {
          data = null
        }
        const errorMessage =
          typeof data?.error === "string" ? data.error : "Failed to send message"
        setError(errorMessage)
        // Server errors (5xx) are retryable, client errors (4xx) are not
        setIsRetryable(response.status >= 500)
        if (
          subscriptionTier === "free" &&
          typeof data?.error === "string" &&
          data.error.toLowerCase().includes("local llm configuration is required")
        ) {
          setLocalReady(false)
        }
        const usagePayload = data?.usage as UsageSummary | undefined
        if (usagePayload) {
          setUsage(usagePayload)
        }
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== tempAssistantId)
        )
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let assistantContent = ""
      let streamFinished = false

      // Stream stall timeout — abort if no data received within this window.
      // Deep-thinking models (Gemini 3.1) can take 60-120s per reasoning phase.
      const STREAM_STALL_TIMEOUT_MS =
        Number(process.env.NEXT_PUBLIC_STREAM_STALL_TIMEOUT_MS) || 180_000
      let staleTimer: ReturnType<typeof setTimeout> | null = null

      const resetStaleTimer = () => {
        if (staleTimer) clearTimeout(staleTimer)
        staleTimer = setTimeout(() => {
          abortController.abort()
        }, STREAM_STALL_TIMEOUT_MS)
      }

      // Start the initial timer
      resetStaleTimer()

      try {
        while (!streamFinished) {
          const { done, value } = await reader.read()
          if (done) {
            streamFinished = true
          } else {
            // Reset stall timer on each chunk received
            resetStaleTimer()
          }
          buffer += decoder.decode(value ?? new Uint8Array(), {
            stream: !done,
          })

          let newlineIndex: number
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim()
            buffer = buffer.slice(newlineIndex + 1)

            if (!line) {
              continue
            }

            let event: Record<string, unknown>
            try {
              event = JSON.parse(line) as Record<string, unknown>
            } catch {
              continue
            }

            const eventType = typeof event.type === "string" ? event.type : undefined
            if (!eventType) {
              continue
            }

            switch (eventType) {
              case "init": {
                const incomingConversationId =
                  typeof event.conversationId === "string"
                    ? event.conversationId
                    : undefined
                if (incomingConversationId) {
                  setConversationId(incomingConversationId)
                }
                break
              }
              case "delta": {
                const delta = typeof event.delta === "string" ? event.delta : ""
                assistantContent += delta
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === tempAssistantId
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                )
                break
              }
              case "followup_delta": {
                // Post-execution follow-up summary from the LLM
                const fDelta = typeof event.delta === "string" ? event.delta : ""
                assistantContent += fDelta
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === tempAssistantId
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                )
                break
              }
              case "usage": {
                const usagePayload = event.usage as UsageSummary | undefined
                if (usagePayload) {
                  setUsage(usagePayload)
                }
                break
              }
              case "complete": {
                const messagesPayload = Array.isArray(event.messages)
                  ? (event.messages as Array<Record<string, unknown>>)
                  : []
                const userRecordRaw = messagesPayload[0]
                const assistantRecordRaw = messagesPayload[1]
                const suggestionPayload = Array.isArray(event.commandSuggestions)
                  ? (event.commandSuggestions as CommandStub[])
                  : undefined
                const planPayload = parsePlanningMetadata(event.planning)

                const completedConversationId =
                  typeof event.conversationId === "string"
                    ? event.conversationId
                    : undefined
                if (completedConversationId) {
                  setConversationId(completedConversationId)
                }

                if (userRecordRaw && typeof userRecordRaw === "object") {
                  const userRecord = userRecordRaw as Partial<ChatMessage>
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempUserId
                        ? {
                          ...msg,
                          id: userRecord.id ?? msg.id,
                          createdAt: userRecord.createdAt ?? msg.createdAt,
                        }
                        : msg
                    )
                  )
                }

                let assistantRecordId: string | undefined
                if (assistantRecordRaw && typeof assistantRecordRaw === "object") {
                  const assistantRecord = assistantRecordRaw as Partial<ChatMessage> & {
                    mcpCommands?: CommandStub[]
                  }
                  assistantContent =
                    assistantRecord.content ?? assistantContent
                  assistantRecordId = assistantRecord.id
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempAssistantId
                        ? {
                          ...msg,
                          id: assistantRecord.id ?? msg.id,
                          content:
                            assistantRecord.content ?? assistantContent,
                          createdAt:
                            assistantRecord.createdAt ?? msg.createdAt,
                          mcpCommands:
                            assistantRecord.mcpCommands?.length
                              ? assistantRecord.mcpCommands
                              : suggestionPayload,
                          plan: planPayload ?? assistantRecord.plan ?? msg.plan,
                        }
                        : msg
                    )
                  )
                }

                const usagePayload = event.usage as UsageSummary | undefined
                if (usagePayload) {
                  setUsage(usagePayload)
                }

                if ((suggestionPayload || planPayload) && completedConversationId) {
                  setHistory((prev) =>
                    prev.map((item) =>
                      item.id === completedConversationId
                        ? {
                          ...item,
                          messages: item.messages.map((msg) =>
                            assistantRecordId && msg.id === assistantRecordId
                              ? {
                                ...msg,
                                mcpCommands: suggestionPayload ?? msg.mcpCommands,
                                plan: planPayload ?? msg.plan,
                              }
                              : msg
                          ),
                        }
                        : item
                    )
                  )
                }

                router.refresh()
                streamFinished = true
                setAgentActive(false)
                break
              }
              case "error": {
                const errorMessage =
                  typeof event.error === "string"
                    ? event.error
                    : "Failed to process AI request"
                setError(errorMessage)
                setAgentActive(false)
                setMessages((prev) =>
                  prev.filter((msg) => msg.id !== tempAssistantId)
                )
                streamFinished = true
                break
              }
              default:
                // Handle agent stream events
                if (eventType.startsWith("agent:")) {
                  const agentEvent: AgentStreamEvent | null =
                    event && typeof event === "object" && "type" in event && typeof event.type === "string" && event.type.startsWith("agent:")
                      ? (event as unknown as AgentStreamEvent)
                      : null
                  if (!agentEvent) break
                  if (agentEvent.type === "agent:planning_start") {
                    setAgentActive(true)
                    setAgentEvents([agentEvent])
                    // Reset monitoring for new pipeline run
                    setMonitoringLogs([])
                    setMonitoringSummary(null)
                  } else if (agentEvent.type === "agent:monitoring_log") {
                    const logEvent = agentEvent as unknown as { entry: typeof monitoringLogs[0] }
                    if (logEvent.entry) {
                      setMonitoringLogs((prev) => [...prev, logEvent.entry])
                    }
                  } else if (agentEvent.type === "agent:monitoring_summary") {
                    const summaryEvent = agentEvent as unknown as { summary: typeof monitoringSummary }
                    if (summaryEvent.summary) {
                      setMonitoringSummary(summaryEvent.summary)
                    }
                  } else if (agentEvent.type === "agent:workflow_proposal") {
                    setActiveWorkflow((agentEvent as unknown as { proposal: WorkflowProposal }).proposal)
                    setAgentEvents((prev) => [...prev, agentEvent])
                  } else if (agentEvent.type === "agent:complete") {
                    setAgentEvents((prev) => [...prev, agentEvent])
                    // Keep active briefly so user can see the final status
                  } else {
                    setAgentEvents((prev) => [...prev, agentEvent])
                  }
                }
                break
            }
          }
        }
      } finally {
        // Clear the stall timer when streaming ends (success or error)
        if (staleTimer) clearTimeout(staleTimer)
      }
    } catch (err) {
      // Classify errors as retryable vs non-retryable
      const isAbort = err instanceof DOMException && err.name === "AbortError"
      const isNetworkError = err instanceof TypeError && err.message.includes("fetch")
      const isStreamError = err instanceof Error && (
        err.message.includes("network") ||
        err.message.includes("abort") ||
        err.message.includes("Failed to fetch") ||
        err.message.includes("The operation was aborted")
      )
      const retryable = isAbort || isNetworkError || isStreamError

      const errorMessage = isAbort
        ? "Connection timed out — the server stopped responding. Your request may still be processing."
        : err instanceof Error
          ? err.message
          : "Something went wrong. Try again."

      setError(errorMessage)
      setIsRetryable(retryable)

      if (!retryable) {
        // Non-retryable: remove the assistant message
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== tempAssistantId)
        )
      }
      // Retryable: keep assistant message (shows partial progress)
    } finally {
      setIsSending(false)
      abortControllerRef.current = null
    }
  }

  /**
   * Retry the last failed request.
   * Re-sends the saved payload to /api/ai/chat.
   */
  function handleRetry() {
    if (!lastPayload || isSending) return
    setError(null)
    setIsRetryable(false)

    // Create a synthetic form event and reinvoke handleSend
    // But we need the same payload, so we restore input and call handleSend
    const message = typeof lastPayload.message === "string" ? lastPayload.message : ""
    setInput(message)
    // Use a microtask so the state update takes effect before handleSend reads it
    setTimeout(() => {
      const form = document.querySelector<HTMLFormElement>('form')
      if (form) form.requestSubmit()
    }, 0)
  }

  function handleStartNew() {
    setConversationId(null)
    setMessages([])
    setError(null)
    setIsRetryable(false)
    setLastPayload(null)
    setInput("")
    setAttachments([])
    setAgentEvents([])
    setAgentActive(false)
  }

  async function updateAssetConfig(partial: Partial<typeof assetConfig>) {
    setError(null)
    if (!isPaidTier && partial.allowWebResearch === true) {
      setError("Upgrade your plan to enable web research.")
      return
    }

    const previousConfig = assetConfig
    const nextConfig = { ...assetConfig, ...partial }
    setAssetConfig(nextConfig)
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowHyper3dAssets: nextConfig.allowHyper3d,
          allowSketchfabAssets: nextConfig.allowSketchfab,
          allowPolyHavenAssets: nextConfig.allowPolyHaven,
          allowWebResearch: nextConfig.allowWebResearch,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to update asset preferences")
      }
      const data = (await response.json()) as {
        allowHyper3dAssets?: boolean
        allowSketchfabAssets?: boolean
        allowPolyHavenAssets?: boolean
        allowWebResearch?: boolean
      }
      setAssetConfig({
        allowHyper3d: Boolean(data.allowHyper3dAssets),
        allowSketchfab: Boolean(data.allowSketchfabAssets),
        allowPolyHaven: data.allowPolyHavenAssets !== false,
        allowWebResearch: Boolean(data.allowWebResearch),
      })
    } catch (err) {
      console.error(err)
      setAssetConfig(previousConfig)
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update asset preferences right now."
      )
    }
  }

  // Suggestion cards for Autopilot empty state
  const SUGGESTIONS = [
    { icon: CastleIcon, label: "Medieval castle with stone walls and towers" },
    { icon: FoxIcon, label: "Low-poly fox character with stylized fur" },
    { icon: RocketIcon, label: "Sci-fi spaceship cockpit interior" },
    { icon: TreeIcon, label: "Autumn forest scene with fallen leaves" },
  ]

  return (
    <>
      {/* Mode Selector — always visible */}
      <div className="mb-4">
        <ModeSelector mode={workflowMode} onChange={setWorkflowMode} />
      </div>

      {/* ── STUDIO MODE ── (always mounted to preserve running agent state) */}
      <div style={{ display: workflowMode === "studio" ? undefined : "none" }}>
        <StudioLayout projectId={projectId} />
      </div>

      {/* ── AUTOPILOT MODE ── */}
      {workflowMode === "autopilot" && (
        <Card>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">Asset integrations</p>
                  <p className="text-xs text-muted-foreground">
                    Poly Haven works out of the box. Enable Hyper3D or Sketchfab only after adding their API keys in the Blender add-on.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={assetConfig.allowPolyHaven}
                    onChange={(event) =>
                      updateAssetConfig({ allowPolyHaven: event.target.checked })
                    }
                  />
                  <span>
                    <span className="font-medium text-foreground">Use Poly Haven assets</span>
                    <span className="block text-xs text-muted-foreground">
                      Enabled by default. Provides HDRIs, textures, and models that do not require API keys.
                      Disable if you prefer to manage downloads manually.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={assetConfig.allowHyper3d}
                    onChange={(event) =>
                      updateAssetConfig({ allowHyper3d: event.target.checked })
                    }
                  />
                  <span>
                    <span className="font-medium text-foreground">Use Hyper3D Rodin assets</span>
                    <span className="block text-xs text-muted-foreground">
                      Requires Hyper3D credentials in Blender. When disabled, the planner will avoid Hyper3D commands.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={assetConfig.allowSketchfab}
                    onChange={(event) =>
                      updateAssetConfig({ allowSketchfab: event.target.checked })
                    }
                  />
                  <span>
                    <span className="font-medium text-foreground">Use Sketchfab assets</span>
                    <span className="block text-xs text-muted-foreground">
                      Requires Sketchfab API token in Blender. When disabled, the planner skips Sketchfab search/download.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={isPaidTier && assetConfig.allowWebResearch}
                    disabled={!isPaidTier}
                    onChange={(event) =>
                      updateAssetConfig({ allowWebResearch: event.target.checked })
                    }
                  />
                  <span>
                    <span className="font-medium text-foreground">Allow web research (Firecrawl)</span>
                    {isPaidTier ? (
                      <span className="block text-xs text-muted-foreground">
                        When enabled, the assistant may pull quick summaries from the web for inspiration and references using Firecrawl.
                      </span>
                    ) : (
                      <span className="block text-xs text-muted-foreground text-destructive">
                        Upgrade to Starter or Pro to unlock web research with Firecrawl.
                      </span>
                    )}
                  </span>
                </label>
              </div>
            </div>
            {history && history.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide text-[11px]">
                  Past sessions
                </span>
                {history.map((item) => {
                  const isActive = conversationId === item.id
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLoadConversation(item)}
                      title={item.preview ?? "Open conversation"}
                    >
                      {formatHistoryLabel(item.lastMessageAt)}
                    </Button>
                  )
                })}
              </div>
            )}

            <div className="h-72 overflow-y-auto rounded-md border bg-muted/30 p-4 space-y-4">
              {messages.length === 0 ? (
                /* Autopilot empty state with suggestion cards */
                <div className="flex flex-col items-center justify-center h-full py-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: "hsl(var(--forge-accent-subtle))" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--forge-accent))" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                      <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                    What would you like to create?
                  </h3>
                  <p className="text-xs mt-1 mb-4" style={{ color: "hsl(var(--forge-text-muted))" }}>
                    Describe your vision and ModelForge will plan and build it
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setInput(s.label)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-xs transition-all hover:shadow-sm"
                        style={{
                          borderColor: "hsl(var(--forge-border))",
                          backgroundColor: "hsl(var(--forge-surface))",
                          color: "hsl(var(--forge-text))",
                        }}
                      >
                        <s.icon size={18} style={{ color: "hsl(var(--forge-accent))", flexShrink: 0 }} />
                        <span className="line-clamp-2">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.id ?? index}-${message.role}-${index}`}
                    className={`flex flex-col gap-1 ${message.role === "assistant" ? "items-start" : "items-end"
                      }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${message.role === "assistant"
                        ? "bg-white shadow"
                        : "bg-primary text-primary-foreground"
                        }`}
                    >
                      {message.content}
                    </div>
                    {message.attachments?.length ? (
                      <div
                        className={`flex flex-wrap gap-2 ${message.role === "assistant" ? "justify-start" : "justify-end"
                          }`}
                      >
                        {message.attachments.map((attachment) => {
                          const previewSrc = attachment.previewUrl ?? attachment.url
                          if (!previewSrc) return null
                          const key = attachment.id ?? `${attachment.name}-${previewSrc}`
                          return (
                            <a
                              key={key}
                              href={attachment.url ?? previewSrc}
                              target={attachment.url ? "_blank" : undefined}
                              rel={attachment.url ? "noreferrer" : undefined}
                              className="block h-20 w-20 overflow-hidden rounded-md border border-border/60 bg-background"
                            >
                              <Image
                                src={previewSrc}
                                alt={attachment.name ?? "Attachment"}
                                width={80}
                                height={80}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            </a>
                          )
                        })}
                      </div>
                    ) : null}
                    {message.role === "assistant" && message.plan && (
                      <div className="max-w-[80%] rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-primary">Planning summary</span>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant={message.plan.executionSuccess ? "default" : "destructive"}
                              className="uppercase text-[10px]"
                            >
                              {message.plan.executionSuccess ? "Plan executed" : "Plan incomplete"}
                            </Badge>
                            {message.plan.fallbackUsed && (
                              <Badge variant="outline" className="uppercase text-[10px]">
                                Fallback used
                              </Badge>
                            )}
                            {message.plan.retries > 0 && (
                              <Badge variant="secondary" className="uppercase text-[10px]">
                                Retries: {message.plan.retries}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{message.plan.planSummary}</p>
                        {message.plan.analysis && (
                          <div className="rounded bg-background/70 px-2 py-1 text-[11px] text-muted-foreground space-y-1">
                            <p className="font-semibold text-foreground">Component breakdown</p>
                            <ul className="list-disc pl-4">
                              {message.plan.analysis.components.map((component) => (
                                <li key={component}>{component}</li>
                              ))}
                            </ul>
                            {message.plan.analysis.materialGuidelines.length > 0 && (
                              <div>
                                <p className="font-medium text-foreground mt-1">Material guidelines</p>
                                <ul className="list-disc pl-4">
                                  {message.plan.analysis.materialGuidelines.map((guideline) => (
                                    <li key={guideline}>{guideline}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
                              {typeof message.plan.analysis.minimumMeshObjects === "number" && (
                                <Badge variant="outline">
                                  Min meshes: {message.plan.analysis.minimumMeshObjects}
                                </Badge>
                              )}
                              {message.plan.analysis.requireLighting !== false && (
                                <Badge variant="outline">Lighting required</Badge>
                              )}
                              {message.plan.analysis.requireCamera !== false && (
                                <Badge variant="outline">Camera required</Badge>
                              )}
                            </div>
                            {message.plan.analysis.notes?.length ? (
                              <div className="mt-1 text-muted-foreground">
                                <p className="font-medium text-foreground">Notes</p>
                                <ul className="list-disc pl-4">
                                  {message.plan.analysis.notes.map((note) => (
                                    <li key={note}>{note}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        )}
                        {message.plan && message.plan.sceneSnapshot && (
                          <details className="rounded bg-background/70 px-2 py-1 text-[11px] text-muted-foreground">
                            <summary className="cursor-pointer text-primary">Scene snapshot used</summary>
                            <pre className="mt-1 whitespace-pre-wrap break-words text-[11px]">
                              {message.plan.sceneSnapshot}
                            </pre>
                          </details>
                        )}
                        {message.plan && message.plan.researchSources?.length ? (
                          <div className="rounded bg-background/70 px-2 py-1 text-[11px] text-muted-foreground space-y-2">
                            <p className="font-semibold text-foreground">Web research references</p>
                            <ul className="space-y-2">
                              {message.plan.researchSources.map((source) => (
                                <li key={source.url} className="space-y-1">
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {source.title}
                                  </a>
                                  {source.snippet && (
                                    <p className="text-muted-foreground">{source.snippet}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : message.plan && message.plan.researchSummary ? (
                          <div className="rounded bg-background/70 px-2 py-1 text-[11px] text-muted-foreground">
                            <p className="font-semibold text-foreground">Web research</p>
                            <pre className="whitespace-pre-wrap text-[11px]">
                              {message.plan.researchSummary}
                            </pre>
                          </div>
                        ) : null}
                        {message.plan && (
                          <div className="space-y-2">
                            {message.plan.planSteps.map((step, stepIndex) => {
                              const commandForStep = resolveCommandForStep(step, stepIndex, message.mcpCommands)
                              const inferredStatus: CommandStub["status"] = commandForStep?.status
                                ?? (message.plan?.executionSuccess ? "executed" : "failed")
                              return (
                                <div
                                  key={`${step.stepNumber}-${step.action}-${stepIndex}`}
                                  className="rounded-md border border-border/60 bg-background px-2 py-1"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-foreground">
                                      Step {step.stepNumber}: {step.action}
                                    </span>
                                    {renderStatusBadge(inferredStatus)}
                                  </div>
                                  {step.rationale && (
                                    <p className="text-[11px] text-muted-foreground">
                                      {step.rationale}
                                    </p>
                                  )}
                                  {commandForStep?.error && (
                                    <div className="mt-1 rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                                      {commandForStep.error}
                                    </div>
                                  )}
                                  {/* Show tool result from execution log */}
                                  {(() => {
                                    const logEntry = message.plan?.executionLog?.find(
                                      (entry) =>
                                        entry.tool === step.action &&
                                        ("stepIndex" in entry ? entry.stepIndex === step.stepNumber - 1 : true) &&
                                        entry.result !== undefined
                                    )
                                    if (!logEntry?.result) return null
                                    const resultText = typeof logEntry.result === "string"
                                      ? logEntry.result
                                      : JSON.stringify(logEntry.result, null, 2)
                                    return (
                                      <details className="mt-1">
                                        <summary className="cursor-pointer text-[11px] text-primary">
                                          View result
                                        </summary>
                                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted/60 px-2 py-1 text-[10px] text-muted-foreground max-h-40 overflow-y-auto">
                                          {resultText}
                                        </pre>
                                      </details>
                                    )
                                  })()}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {message.plan.errors?.length ? (
                          <div className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                            {message.plan.errors.join("; ")}
                          </div>
                        ) : null}
                        {/* Full execution log */}
                        {message.plan.executionLog?.length ? (
                          <details className="rounded bg-background/70 px-2 py-1 text-[11px] text-muted-foreground">
                            <summary className="cursor-pointer text-primary font-medium">
                              Full execution log ({message.plan.executionLog.length} entries)
                            </summary>
                            <div className="mt-1 max-h-48 overflow-y-auto space-y-1 font-mono">
                              {message.plan.executionLog.map((entry, idx) => (
                                <div key={idx} className={cn(
                                  "rounded px-2 py-0.5 text-[10px]",
                                  entry.error ? "bg-destructive/10 text-destructive" : "bg-muted/40"
                                )}>
                                  <span className="text-muted-foreground/60 mr-1">{entry.timestamp?.split("T")[1]?.split(".")[0] ?? ""}</span>
                                  <strong>{entry.logType ?? entry.tool}</strong>
                                  {entry.detail && <span className="ml-1">— {entry.detail}</span>}
                                  {entry.error && <span className="ml-1 text-destructive">⚠ {entry.error}</span>}
                                  {entry.result != null && (
                                    <details className="mt-0.5">
                                      <summary className="cursor-pointer text-primary">result</summary>
                                      <pre className="whitespace-pre-wrap break-words max-h-24 overflow-y-auto bg-background/50 rounded p-1">
                                        {typeof entry.result === "string" ? entry.result : JSON.stringify(entry.result, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : null}
                        {/* Raw LLM plan response */}
                        {message.plan.rawPlan && (
                          <details className="rounded bg-background/70 px-2 py-1 text-[11px] text-muted-foreground">
                            <summary className="cursor-pointer text-primary">Raw LLM plan response</summary>
                            <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] max-h-48 overflow-y-auto">
                              {message.plan.rawPlan}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                    {/* Guided workflow panel (neural/hybrid requests) */}
                    {message.role === "assistant" &&
                      index === messages.length - 1 &&
                      activeWorkflow && (
                        <div className="max-w-[90%]">
                          <WorkflowPanel
                            proposal={activeWorkflow}
                            onStepAction={(stepId, action) => {
                              console.log(`[Workflow] Step ${stepId}: ${action}`)
                            }}
                          />
                        </div>
                      )}
                    {/* Pipeline monitoring panel */}
                    {message.role === "assistant" &&
                      index === messages.length - 1 &&
                      monitoringLogs.length > 0 && (
                        <div className="max-w-[90%]">
                          <MonitoringPanel
                            logs={monitoringLogs}
                            summary={monitoringSummary}
                          />
                        </div>
                      )}
                    {message.role === "assistant" &&
                      Array.isArray(message.mcpCommands) &&
                      message.mcpCommands.length > 0 && (
                        <div className="max-w-[80%] rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground space-y-2">
                          <p className="font-medium text-primary">
                            MCP execution summary
                          </p>
                          <ul className="space-y-2">
                            {message.mcpCommands.map((command) => (
                              <li key={command.id} className="flex flex-col gap-1 rounded-md border border-border/60 bg-background/70 p-2 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-foreground">{command.tool}</span>
                                  {renderStatusBadge(command.status)}
                                </div>
                                <span className="text-muted-foreground">{command.description}</span>
                                {command.notes && (
                                  <span className="italic text-[11px] text-muted-foreground/80">
                                    {command.notes}
                                  </span>
                                )}
                                {command.status === "failed" && command.error && (
                                  <div className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                                    {command.error}
                                  </div>
                                )}
                                {command.status === "executed" && formatResult(command.result) && (
                                  <pre className="rounded bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                                    {formatResult(command.result)}
                                  </pre>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    {message.createdAt && (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* ── Agent Activity Log ── */}
            {agentEvents.length > 0 && (
              <details open={agentActive} className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                <summary className="cursor-pointer font-semibold text-primary flex items-center gap-2">
                  {agentActive && (
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                  Agent Activity Log ({agentEvents.length} events)
                </summary>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {agentEvents.map((evt, i) => (
                    <div key={i} className={cn(
                      "rounded px-2 py-1",
                      evt.type === "agent:step_error" || (evt.type === "agent:step_validate" && !evt.valid)
                        ? "bg-destructive/10 text-destructive"
                        : evt.type === "agent:step_validate" && evt.valid
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : evt.type === "agent:planning_reasoning" || evt.type === "agent:step_recover"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-muted/50 text-muted-foreground"
                    )}>
                      <span className="text-[10px] text-muted-foreground/70 mr-2">
                        {(() => {
                          try {
                            return new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                          } catch {
                            return "--:--:--"
                          }
                        })()}
                      </span>
                      {evt.type === "agent:planning_start" && (
                        <span>🧠 Planning started...</span>
                      )}
                      {evt.type === "agent:planning_reasoning" && (
                        <span className="whitespace-pre-wrap">💭 <strong>LLM Reasoning:</strong> {evt.reasoning}</span>
                      )}
                      {evt.type === "agent:planning_complete" && (
                        <span>📋 Plan ready — {evt.stepCount} steps</span>
                      )}
                      {evt.type === "agent:step_start" && (
                        <span>▶ Step {evt.stepIndex + 1}/{evt.stepCount}: <strong>{evt.action}</strong> — {evt.rationale}</span>
                      )}
                      {evt.type === "agent:code_generation" && (
                        <span>🐍 Generating Python for step {evt.stepIndex + 1}: {evt.description}</span>
                      )}
                      {evt.type === "agent:step_result" && (
                        <details className="inline">
                          <summary className="cursor-pointer">
                            {evt.success ? "✅" : "❌"} Step {evt.stepIndex + 1} result ({evt.action})
                          </summary>
                          <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] max-h-32 overflow-y-auto bg-background/50 rounded p-1">
                            {typeof evt.result === "string" ? evt.result : JSON.stringify(evt.result, null, 2)}
                          </pre>
                        </details>
                      )}
                      {evt.type === "agent:step_validate" && (
                        <span>
                          {evt.valid ? "✓ Validated" : "✗ Validation failed"}: {evt.action}
                          {evt.reason && <span className="ml-1 text-[10px]">— {evt.reason}</span>}
                        </span>
                      )}
                      {evt.type === "agent:step_recover" && (
                        <span>🔄 Recovery for {evt.action}: <strong>{evt.recoveryAction}</strong> — {evt.rationale}</span>
                      )}
                      {evt.type === "agent:step_error" && (
                        <span>⚠ Step {evt.stepIndex + 1} error (attempt {evt.attempt + 1}): {evt.error}</span>
                      )}
                      {evt.type === "agent:vision" && (
                        <span>👁 Vision: {evt.assessment}{evt.issues?.length ? ` | Issues: ${evt.issues.join(", ")}` : ""}</span>
                      )}
                      {evt.type === "agent:audit" && (
                        <span>{evt.success ? "✅" : "❌"} Scene audit: {evt.reason ?? (evt.success ? "passed" : "failed")}</span>
                      )}
                      {evt.type === "agent:complete" && (
                        <span>
                          {evt.success ? "🎉" : "⚠"} Complete: {evt.completedCount} succeeded, {evt.failedCount} failed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <span className="flex-1">{error}</span>
                {isRetryable && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRetry}
                    disabled={isSending}
                    className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/20"
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}
            <form onSubmit={handleSend} className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2",
                  localProviderConfigured
                    ? "border-border/70 bg-muted/30"
                    : "border-destructive/40 bg-destructive/10"
                )}
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Local agent
                  </p>
                  {localProviderConfigured ? (
                    <>
                      <p className="text-sm font-medium">
                        {providerLabel}
                        {localProvider.model ? ` • ${localProvider.model}` : ""}
                      </p>
                      {providerEndpoint && (
                        <p className="text-xs text-muted-foreground">Endpoint: {providerEndpoint}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-destructive">
                      No local LLM is configured. Configure one to start prompting.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={localProviderConfigured ? localProvider.provider ?? "" : "configure"}
                    onChange={handleProviderChange}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ollama">Ollama</option>
                    <option value="lmstudio">LM Studio</option>
                    <option value="configure">Configure providers…</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/settings#local-llm")}
                  >
                    Manage
                  </Button>
                </div>
              </div>
              {/* Blender MCP connection indicator */}
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs",
                  mcpConnected === true
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : mcpConnected === false
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border/50 bg-muted/30 text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    mcpConnected === true
                      ? "bg-emerald-500 animate-pulse"
                      : mcpConnected === false
                        ? "bg-destructive"
                        : "bg-muted-foreground"
                  )}
                />
                {mcpConnected === true && "Blender addon connected (port 9876)"}
                {mcpConnected === false && "Blender addon not connected — open Blender and connect the ModelForge addon on port 9876"}
                {mcpConnected === null && "Checking Blender connection…"}
              </div>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="relative h-20 w-20 overflow-hidden rounded-md border border-border/70 bg-background shadow-sm"
                    >
                      <Image
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        width={80}
                        height={80}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-xs text-muted-foreground hover:bg-background"
                        aria-label={`Remove ${attachment.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you need—ModelForge can craft Blender geometry, tweak materials, set up lighting, and more."
                rows={3}
                disabled={isSending}
                className={cn(
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  "resize-none"
                )}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAttachmentButton}
                    disabled={isSending || attachments.length >= MAX_ATTACHMENTS}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Attach image
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleStartNew}
                    disabled={isSending || messages.length === 0}
                  >
                    Start New Conversation
                  </Button>
                </div>
                {isSending ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      abortControllerRef.current?.abort()
                      abortControllerRef.current = null
                      setIsSending(false)
                      setAgentActive(false)
                    }}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Processing
                  </Button>
                ) : (
                  <Button type="submit" disabled={!canSend}>
                    Send to ModelForge
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  )
}
