"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, RefreshCw, Square } from "lucide-react"
import { ModelViewer } from "@/components/generation/ModelViewer"
import { cn } from "@/lib/utils"
import {
    CATEGORIES,
    getToolsForCategory,
    getToolById,
    type CategoryMeta,
    type StudioCategory,
    type ToolEntry,
    type ToolInput,
} from "@/lib/orchestration/tool-catalog"
import type { WorkflowTimelineNeuralState, WorkflowTimelineStep } from "./workflow-timeline"

interface StudioWorkspaceProps {
    activeCategory: string
    onToolSelect: (tool: ToolEntry, inputs: Record<string, string>) => void
    onToolRunNow: (tool: ToolEntry, inputs: Record<string, string>) => void
    onNeuralRunStart: (tool: ToolEntry, inputs: Record<string, string>, existingStepId?: string) => string
    onNeuralRunUpdate: (stepId: string, patch: Partial<Pick<WorkflowTimelineStep, "status" | "error" | "inputs" | "neuralState">>) => void
    selectedPipelineStep?: WorkflowTimelineStep | null
    onRequestCategoryChange?: (category: StudioCategory) => void
    externalToolLaunch?: {
        token: string
        toolId: string
        inputs: Record<string, string>
    } | null
}

type NeuralDockMode = "docked" | "collapsed" | "focus"
type NeuralRunStatus = "running" | "ready" | "failed" | "stopped"
type NeuralViewerSource = "generated" | "demo" | "input"

interface ActiveNeuralRun {
    stepId: string
    tool: ToolEntry
    inputs: Record<string, string>
    draftInputs: Record<string, string>
    status: NeuralRunStatus
    dockMode: NeuralDockMode
    viewerUrl: string | null
    viewerLabel?: string
    viewerSource?: NeuralViewerSource
    error?: string
    generationTimeMs?: number
}

interface NeuralRunResponse {
    status: "completed" | "failed"
    viewerUrl?: string | null
    generationTimeMs?: number
    error?: string
}

interface ViewerSample {
    id: string
    name: string
    source: string
    url: string
}

function buildPersistedNeuralState(run: ActiveNeuralRun): WorkflowTimelineNeuralState {
    return {
        draftInputs: run.draftInputs,
        viewerUrl: run.viewerUrl,
        viewerLabel: run.viewerLabel,
        viewerSource: run.viewerSource,
        generationTimeMs: run.generationTimeMs,
    }
}

function mapTimelineStatusToNeuralStatus(status: WorkflowTimelineStep["status"]): NeuralRunStatus {
    switch (status) {
        case "running":
            return "running"
        case "done":
            return "ready"
        case "failed":
            return "failed"
        default:
            return "ready"
    }
}

function resolveInputDisplayValue(input: ToolInput, inputs: Record<string, string>): string {
    const rawValue = inputs[input.key]
    if (!rawValue) return "Not provided"

    if (input.type === "select") {
        const option = input.options?.find((opt) => opt.value === rawValue)
        return option?.label ?? rawValue
    }

    return rawValue
}

function PreviewImage(props: React.ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
    const { alt, ...imgProps } = props

    // Uploaded reference previews use in-memory data URLs, so Next image optimization does not apply.
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...imgProps} />
}

function getAssetDisplayLabel(value: string): string {
    if (!value) return "Attached 3D model"

    if (value.startsWith("data:")) {
        return "Attached 3D model"
    }

    try {
        const baseUrl =
            typeof window !== "undefined"
                ? window.location.origin
                : "http://127.0.0.1"
        const url = new URL(value, baseUrl)
        const pathParam = url.searchParams.get("path")
        if (pathParam) {
            const decoded = decodeURIComponent(pathParam)
            const parts = decoded.split(/[\\/]/).filter(Boolean)
            return parts[parts.length - 1] ?? "Attached 3D model"
        }

        const parts = url.pathname.split("/").filter(Boolean)
        const lastPart = parts[parts.length - 1]
        if (lastPart && lastPart !== "neural-output") {
            return decodeURIComponent(lastPart)
        }
    } catch {
        // Fall through to plain path handling
    }

    const decodedValue = (() => {
        try {
            return decodeURIComponent(value)
        } catch {
            return value
        }
    })()
    const parts = decodedValue.split(/[\\/]/).filter(Boolean)
    return parts[parts.length - 1] ?? "Attached 3D model"
}

function MeshAttachmentCard({
    value,
    emptyMessage,
    description,
}: {
    value?: string
    emptyMessage: string
    description?: string
}) {
    if (!value) {
        return (
            <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                    borderColor: "hsl(var(--forge-border))",
                    backgroundColor: "hsl(var(--forge-surface-dim))",
                    color: "hsl(var(--forge-text-muted))",
                }}
            >
                {emptyMessage}
            </div>
        )
    }

    return (
        <div
            className="rounded-2xl border p-4"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface-dim))",
            }}
        >
            <div className="flex items-start gap-4">
                <div
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        backgroundColor: "hsl(var(--forge-surface))",
                    }}
                >
                    <ModelViewer
                        url={value}
                        className="h-full w-full rounded-none border-0"
                        showControls={false}
                        showFooter={false}
                        interactive={false}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                        Attached model
                    </p>
                    <p className="mt-1 text-sm font-medium" style={{ color: "hsl(var(--forge-text))" }}>
                        {getAssetDisplayLabel(value)}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
                        {description ?? "This tool will use the current project model as its source mesh."}
                    </p>
                </div>
            </div>
        </div>
    )
}

async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error("Failed to read image file"))
        reader.readAsDataURL(file)
    })
}

// ── Difficulty Badge ────────────────────────────────────────────

function DifficultyBadge({ level }: { level: string }) {
    const colors: Record<string, { bg: string; text: string }> = {
        beginner: {
            bg: "hsl(var(--forge-accent-subtle))",
            text: "hsl(var(--forge-accent))",
        },
        intermediate: { bg: "hsl(48 96% 95%)", text: "hsl(40 80% 40%)" },
        advanced: { bg: "hsl(0 80% 95%)", text: "hsl(0 60% 45%)" },
    }
    const c = colors[level] ?? colors.beginner
    return (
        <span
            className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
            style={{ backgroundColor: c.bg, color: c.text }}
        >
            {level === "beginner" ? "Beginner friendly" : level}
        </span>
    )
}

function ToolTypeBadge({ type }: { type: string }) {
    if (type === "neural") {
        return (
            <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                    backgroundColor: "hsl(var(--forge-accent-muted))",
                    color: "hsl(var(--forge-accent))",
                }}
            >
                AI Model
            </span>
        )
    }
    return null
}

// ── Compact Tool Card (grid view) ───────────────────────────────

function ToolCardCompact({
    tool,
    onOpen,
}: {
    tool: ToolEntry
    onOpen: () => void
}) {
    return (
        <button
            onClick={onOpen}
            className="text-left rounded-2xl border transition-all duration-200 hover:shadow-md p-5 group"
            style={{
                backgroundColor: "var(--forge-glass)",
                borderColor: "hsl(var(--forge-border))",
                backdropFilter: "blur(12px)",
                boxShadow: "var(--forge-shadow)",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3
                            className="font-semibold text-base"
                            style={{ color: "hsl(var(--forge-text))" }}
                        >
                            {tool.name}
                        </h3>
                        <ToolTypeBadge type={tool.type} />
                        <DifficultyBadge level={tool.difficulty} />
                    </div>
                    <p
                        className="text-sm mt-1.5 line-clamp-2"
                        style={{ color: "hsl(var(--forge-text-muted))" }}
                    >
                        {tool.tagline}
                    </p>
                </div>
                {/* Open arrow */}
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="hsl(var(--forge-text-subtle))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform"
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </div>

            <div className="flex items-center gap-4 mt-3">
                {tool.cost && (
                    <span
                        className="text-xs font-medium"
                        style={{ color: "hsl(var(--forge-text-subtle))" }}
                    >
                        {tool.cost}
                    </span>
                )}
                {tool.estimatedTime && (
                    <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: "hsl(var(--forge-text-subtle))" }}
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {tool.estimatedTime}
                    </span>
                )}
            </div>
        </button>
    )
}

// ── Full-Size Tool Detail View ──────────────────────────────────

function ToolDetailView({
    tool,
    onBack,
    onSubmit,
    onRunNow,
    initialInputs,
}: {
    tool: ToolEntry
    onBack: () => void
    onSubmit: (tool: ToolEntry, inputs: Record<string, string>) => void
    onRunNow: (tool: ToolEntry, inputs: Record<string, string>) => void
    initialInputs?: Record<string, string>
}) {
    const [inputs, setInputs] = useState<Record<string, string>>(initialInputs ?? {})

    const handleSubmit = () => {
        onSubmit(tool, inputs)
        setInputs({})
    }

    const handleRunNow = () => {
        onRunNow(tool, inputs)
        setInputs({})
    }

    return (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 xl:p-8">
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 mb-6 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "hsl(var(--forge-accent))" }}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to tools
            </button>

            <div className="max-w-[68rem]">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h2
                            className="text-2xl font-bold"
                            style={{ color: "hsl(var(--forge-text))" }}
                        >
                            {tool.name}
                        </h2>
                        <ToolTypeBadge type={tool.type} />
                        <DifficultyBadge level={tool.difficulty} />
                    </div>
                    <p
                        className="text-base"
                        style={{ color: "hsl(var(--forge-text-muted))" }}
                    >
                        {tool.tagline}
                    </p>
                </div>

                {/* Description */}
                <div
                    className="rounded-xl p-4 mb-6"
                    style={{
                        backgroundColor: "hsl(var(--forge-surface-dim))",
                        border: "1px solid hsl(var(--forge-border))",
                    }}
                >
                    <p
                        className="text-sm leading-relaxed"
                        style={{ color: "hsl(var(--forge-text-muted))" }}
                    >
                        {tool.description}
                    </p>
                </div>

                {/* Best for / Not for */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <h4
                            className="text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: "hsl(var(--forge-accent))" }}
                        >
                            Best for
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {tool.bestFor.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                    style={{
                                        backgroundColor: "hsl(var(--forge-accent-subtle))",
                                        color: "hsl(var(--forge-accent))",
                                    }}
                                >
                                    ✓ {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    {tool.notFor.length > 0 && (
                        <div>
                            <h4
                                className="text-xs font-semibold uppercase tracking-wider mb-2"
                                style={{ color: "hsl(var(--forge-text-subtle))" }}
                            >
                                Not ideal for
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {tool.notFor.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                        style={{
                                            backgroundColor: "hsl(0 0% 95%)",
                                            color: "hsl(var(--forge-text-subtle))",
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Meta: time + cost */}
                <div className="flex items-center gap-6 mb-6">
                    {tool.estimatedTime && (
                        <div className="flex items-center gap-2">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="hsl(var(--forge-text-subtle))"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span
                                className="text-sm"
                                style={{ color: "hsl(var(--forge-text-muted))" }}
                            >
                                {tool.estimatedTime}
                            </span>
                        </div>
                    )}
                    {tool.cost && (
                        <div className="flex items-center gap-2">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="hsl(var(--forge-text-subtle))"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            <span
                                className="text-sm font-medium"
                                style={{ color: "hsl(var(--forge-text-muted))" }}
                            >
                                {tool.cost}
                            </span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div
                    className="h-px mb-6"
                    style={{ backgroundColor: "hsl(var(--forge-border))" }}
                />

                {/* Input Form */}
                {tool.inputs && tool.inputs.length > 0 && (
                    <div className="space-y-5">
                        <h3
                            className="text-sm font-semibold"
                            style={{ color: "hsl(var(--forge-text))" }}
                        >
                            Configuration
                        </h3>

                        {tool.inputs.map((input: ToolInput) => (
                            <div key={input.key}>
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: "hsl(var(--forge-text))" }}
                                >
                                    {input.label}
                                    {input.required && (
                                        <span style={{ color: "hsl(var(--forge-accent))" }}>
                                            {" "}
                                            *
                                        </span>
                                    )}
                                </label>

                                {input.type === "text" && (
                                    <textarea
                                        value={inputs[input.key] ?? ""}
                                        onChange={(e) =>
                                            setInputs({ ...inputs, [input.key]: e.target.value })
                                        }
                                        placeholder={input.placeholder}
                                        rows={4}
                                        className="w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 transition"
                                        style={{
                                            borderColor: "hsl(var(--forge-border))",
                                            backgroundColor: "hsl(var(--forge-surface-dim))",
                                            color: "hsl(var(--forge-text))",
                                        }}
                                    />
                                )}

                                {input.type === "select" && (
                                    <select
                                        value={
                                            inputs[input.key] ??
                                            (input.defaultValue?.toString() ?? "")
                                        }
                                        onChange={(e) =>
                                            setInputs({ ...inputs, [input.key]: e.target.value })
                                        }
                                        className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                                        style={{
                                            borderColor: "hsl(var(--forge-border))",
                                            backgroundColor: "hsl(var(--forge-surface-dim))",
                                            color: "hsl(var(--forge-text))",
                                        }}
                                    >
                                        <option value="">Select...</option>
                                        {input.options?.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                                {opt.description ? ` — ${opt.description}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {input.type === "mesh" && (
                                    <MeshAttachmentCard
                                        value={inputs[input.key]}
                                        emptyMessage="No model is attached yet. Continue from a generated result or a future asset selector to populate this field."
                                    />
                                )}

                                {input.type === "image" && (
                                    <div>
                                        {inputs[input.key] ? (
                                            /* Image preview with remove button */
                                            <div className="relative inline-block">
                                                <PreviewImage
                                                    src={inputs[input.key]}
                                                    alt="Reference"
                                                    className="max-h-40 rounded-xl border object-contain"
                                                    style={{ borderColor: "hsl(var(--forge-border))" }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setInputs({ ...inputs, [input.key]: "" })}
                                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                                                    style={{ backgroundColor: "hsl(0 84% 60%)" }}
                                                    aria-label="Remove image"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            /* Upload area */
                                            <label
                                                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-[hsl(var(--forge-accent))] transition flex flex-col items-center gap-2"
                                                style={{
                                                    borderColor: "hsl(var(--forge-border))",
                                                    backgroundColor: "hsl(var(--forge-surface-dim))",
                                                }}
                                            >
                                                <svg
                                                    width="32"
                                                    height="32"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="hsl(var(--forge-text-subtle))"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                                <p
                                                    className="text-sm"
                                                    style={{ color: "hsl(var(--forge-text-subtle))" }}
                                                >
                                                    Click to upload a reference image
                                                </p>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onClick={(e) => {
                                                        // Reset value so re-selecting the same file triggers onChange
                                                        (e.target as HTMLInputElement).value = ""
                                                    }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (!file) return
                                                        // Validate file size (10 MB max)
                                                        const MAX_SIZE = 10 * 1024 * 1024
                                                        if (file.size > MAX_SIZE) {
                                                            alert("Image must be under 10 MB")
                                                            return
                                                        }
                                                        const reader = new FileReader()
                                                        reader.onload = () => {
                                                            setInputs({ ...inputs, [input.key]: reader.result as string })
                                                        }
                                                        reader.onerror = () => {
                                                            console.error("Failed to read image file")
                                                        }
                                                        reader.readAsDataURL(file)
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                )}

                                {input.type === "slider" && (
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            min={input.min ?? 0}
                                            max={input.max ?? 100}
                                            step={input.step ?? 1}
                                            value={
                                                inputs[input.key] ?? input.defaultValue ?? "50"
                                            }
                                            onChange={(e) =>
                                                setInputs({ ...inputs, [input.key]: e.target.value })
                                            }
                                            className="w-full accent-[hsl(var(--forge-accent))]"
                                        />
                                        <div className="flex justify-between text-xs" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                            <span>{input.min ?? 0}</span>
                                            <span className="font-medium" style={{ color: "hsl(var(--forge-accent))" }}>
                                                {inputs[input.key] ?? input.defaultValue ?? 50}
                                            </span>
                                            <span>{input.max ?? 100}</span>
                                        </div>
                                    </div>
                                )}

                                {input.helpText && (
                                    <p
                                        className="text-xs mt-1.5"
                                        style={{ color: "hsl(var(--forge-text-subtle))" }}
                                    >
                                        {input.helpText}
                                    </p>
                                )}
                            </div>
                        ))}

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleRunNow}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                                style={{
                                    backgroundColor: "hsl(var(--forge-accent))",
                                    boxShadow:
                                        "0 2px 8px hsl(168 75% 32% / 0.3)",
                                }}
                            >
                                ▶ Run Now
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 border"
                                style={{
                                    backgroundColor: "transparent",
                                    borderColor: "hsl(var(--forge-border))",
                                    color: "hsl(var(--forge-text))",
                                }}
                            >
                                + Add to Workflow
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function NeuralRunStatusBadge({ status }: { status: NeuralRunStatus }) {
    const config = {
        running: {
            label: "Generating",
            bg: "hsl(var(--forge-accent-subtle))",
            text: "hsl(var(--forge-accent))",
            dotClass: "bg-teal-400 animate-pulse",
        },
        ready: {
            label: "Ready",
            bg: "rgba(52, 211, 153, 0.15)",
            text: "hsl(153 60% 40%)",
            dotClass: "bg-emerald-400",
        },
        failed: {
            label: "Failed",
            bg: "rgba(248, 113, 113, 0.15)",
            text: "hsl(0 84% 60%)",
            dotClass: "bg-red-400",
        },
        stopped: {
            label: "Stopped",
            bg: "rgba(113, 113, 122, 0.15)",
            text: "hsl(var(--forge-text-subtle))",
            dotClass: "bg-zinc-400",
        },
    } satisfies Record<NeuralRunStatus, { label: string; bg: string; text: string; dotClass: string }>
    const current = config[status]

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: current.bg, color: current.text }}
        >
            <span className={`h-2 w-2 rounded-full ${current.dotClass}`} />
            {current.label}
        </span>
    )
}

function NeuralViewerStage({
    title,
    status,
    viewerUrl,
    viewerLabel,
    viewerSource,
    error,
    generationTimeMs,
}: {
    title: string
    status: NeuralRunStatus
    viewerUrl: string | null
    viewerLabel?: string
    viewerSource?: NeuralViewerSource
    error?: string
    generationTimeMs?: number
}) {
    const displayViewerLabel =
        viewerSource === "input" && viewerUrl
            ? getAssetDisplayLabel(viewerUrl)
            : viewerLabel

    return (
        <div
            className="relative flex min-h-0 flex-1 overflow-hidden"
            style={{
                backgroundColor: "hsl(var(--forge-surface-dim))",
            }}
        >
            {viewerUrl ? (
                <ModelViewer
                    url={viewerUrl}
                    className="h-full min-h-0 rounded-none border-0"
                />
            ) : (
                <div
                    className="flex h-full min-h-0 flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.08),_rgba(255,255,255,0.96)_58%)] px-8 text-center"
                >
                    <div className="max-w-md space-y-3">
                        {status === "running" && (
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--forge-accent-subtle))]">
                                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "hsl(var(--forge-accent))" }} />
                            </div>
                        )}
                        <p className="text-lg font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                            {status === "running"
                                ? "Preparing your 3D model"
                                : status === "failed"
                                    ? "Generation did not complete"
                                    : status === "stopped"
                                        ? "Generation stopped"
                                        : "Viewer ready"}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
                            {status === "running"
                                ? "The viewer stage stays in place while the neural model runs. The first result will appear here automatically."
                                : error ?? "This area will render the first generated GLB as soon as it is available."}
                        </p>
                    </div>
                </div>
            )}

            {error && (status === "failed" || status === "stopped") && (
                <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex justify-center px-6">
                    <div
                        className="max-w-xl rounded-2xl border px-4 py-3 shadow-lg"
                        style={{
                            borderColor: status === "failed" ? "rgba(239, 68, 68, 0.28)" : "rgba(245, 158, 11, 0.28)",
                            backgroundColor: status === "failed" ? "rgba(254, 242, 242, 0.92)" : "rgba(255, 251, 235, 0.94)",
                        }}
                    >
                        <p
                            className="text-sm font-semibold"
                            style={{
                                color: status === "failed" ? "rgb(185, 28, 28)" : "rgb(180, 83, 9)",
                            }}
                        >
                            {status === "failed" ? "Generation failed" : "Generation stopped"}
                        </p>
                        <p
                            className="mt-1 text-sm leading-relaxed"
                            style={{
                                color: status === "failed" ? "rgb(127, 29, 29)" : "rgb(120, 53, 15)",
                            }}
                        >
                            {error}
                        </p>
                    </div>
                </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-white/95 via-white/60 to-transparent px-6 pb-10 pt-5 sm:pr-[22rem]">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                        Neural viewer
                    </p>
                    <h3 className="text-2xl font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                        {title}
                    </h3>
                    <div className="pointer-events-auto mt-3 flex max-w-[38rem] flex-wrap items-center gap-2">
                        {displayViewerLabel && (
                            <div className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium" style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "rgba(255,255,255,0.78)",
                                color: "hsl(var(--forge-text-muted))",
                            }}>
                                <span className="h-2 w-2 rounded-full" style={{
                                    backgroundColor:
                                        viewerSource === "demo"
                                            ? "hsl(var(--forge-accent))"
                                            : viewerSource === "input"
                                                ? "hsl(215 90% 55%)"
                                                : "hsl(153 60% 40%)",
                                }} />
                                <span className="truncate">
                                    {viewerSource === "demo"
                                        ? `Demo model: ${displayViewerLabel}`
                                        : viewerSource === "input"
                                            ? `Attached model: ${displayViewerLabel}`
                                            : displayViewerLabel}
                                </span>
                            </div>
                        )}
                        {typeof generationTimeMs === "number" && generationTimeMs > 0 && (
                            <span className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{
                                borderColor: "hsl(var(--forge-border))",
                                color: "hsl(var(--forge-text-subtle))",
                                backgroundColor: "rgba(255,255,255,0.72)",
                            }}>
                                {(generationTimeMs / 1000).toFixed(1)}s
                            </span>
                        )}
                        <NeuralRunStatusBadge status={status} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function NeuralRerunFields({
    tool,
    inputs,
    onChange,
}: {
    tool: ToolEntry
    inputs: Record<string, string>
    onChange: (key: string, value: string) => void
}) {
    return (
        <div className="space-y-4">
            {tool.inputs.map((input) => (
                <div key={input.key}>
                    <label
                        className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em]"
                        style={{ color: "hsl(var(--forge-text-subtle))" }}
                    >
                        {input.label}
                        {input.required ? " *" : ""}
                    </label>

                    {input.type === "text" && (
                        <textarea
                            value={inputs[input.key] ?? ""}
                            onChange={(event) => onChange(input.key, event.target.value)}
                            placeholder={input.placeholder}
                            rows={4}
                            className="w-full rounded-2xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 transition"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "hsl(var(--forge-surface-dim))",
                                color: "hsl(var(--forge-text))",
                            }}
                        />
                    )}

                    {input.type === "select" && (
                        <select
                            value={inputs[input.key] ?? (input.defaultValue?.toString() ?? "")}
                            onChange={(event) => onChange(input.key, event.target.value)}
                            className="w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "hsl(var(--forge-surface-dim))",
                                color: "hsl(var(--forge-text))",
                            }}
                        >
                            <option value="">Select...</option>
                            {input.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                    {option.description ? ` — ${option.description}` : ""}
                                </option>
                            ))}
                        </select>
                    )}

                    {input.type === "slider" && (
                        <div className="space-y-2 rounded-2xl border px-4 py-3" style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "hsl(var(--forge-surface-dim))",
                        }}>
                            <input
                                type="range"
                                min={input.min ?? 0}
                                max={input.max ?? 100}
                                step={input.step ?? 1}
                                value={inputs[input.key] ?? input.defaultValue ?? "50"}
                                onChange={(event) => onChange(input.key, event.target.value)}
                                className="w-full accent-[hsl(var(--forge-accent))]"
                            />
                            <div className="flex justify-between text-xs" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                <span>{input.min ?? 0}</span>
                                <span className="font-medium" style={{ color: "hsl(var(--forge-accent))" }}>
                                    {inputs[input.key] ?? input.defaultValue ?? 50}
                                </span>
                                <span>{input.max ?? 100}</span>
                            </div>
                        </div>
                    )}

                    {input.type === "mesh" && (
                        <MeshAttachmentCard
                            value={inputs[input.key]}
                            emptyMessage="No model is attached yet. Continue from a generated result or a future asset selector to populate this field."
                        />
                    )}

                    {input.type === "image" && (
                        <div>
                            {inputs[input.key] ? (
                                <div className="relative inline-block">
                                    <PreviewImage
                                        src={inputs[input.key]}
                                        alt={input.label}
                                        className="max-h-48 rounded-2xl border object-contain"
                                        style={{ borderColor: "hsl(var(--forge-border))" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onChange(input.key, "")}
                                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full text-xs font-bold text-white shadow-md"
                                        style={{ backgroundColor: "hsl(0 84% 60%)" }}
                                        aria-label={`Remove ${input.label}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <label
                                    className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center transition hover:border-[hsl(var(--forge-accent))]"
                                    style={{
                                        borderColor: "hsl(var(--forge-border))",
                                        backgroundColor: "hsl(var(--forge-surface-dim))",
                                    }}
                                >
                                    <svg
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="hsl(var(--forge-text-subtle))"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                    <p className="text-sm" style={{ color: "hsl(var(--forge-text-muted))" }}>
                                        Click to upload a reference image
                                    </p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onClick={(event) => {
                                            (event.target as HTMLInputElement).value = ""
                                        }}
                                        onChange={async (event) => {
                                            const file = event.target.files?.[0]
                                            if (!file) return
                                            if (file.size > 10 * 1024 * 1024) {
                                                window.alert("Image must be under 10 MB")
                                                return
                                            }
                                            try {
                                                const value = await fileToDataUrl(file)
                                                onChange(input.key, value)
                                            } catch (error) {
                                                console.error(error)
                                            }
                                        }}
                                    />
                                </label>
                            )}
                        </div>
                    )}

                    {input.helpText && (
                        <p className="mt-1.5 text-xs" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                            {input.helpText}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}

function NeuralRunOverlay({
    run,
    referenceImage,
    viewerSamples,
    draftInputs,
    onLoadDemo,
    onDraftInputChange,
    onContinueToNextTool,
    onCollapse,
    onToggleFocus,
    onStop,
    onRunAgain,
}: {
    run: ActiveNeuralRun
    referenceImage?: string
    viewerSamples: ViewerSample[]
    draftInputs: Record<string, string>
    onLoadDemo: (sample: ViewerSample) => void
    onDraftInputChange: (key: string, value: string) => void
    onContinueToNextTool: () => void
    onCollapse: () => void
    onToggleFocus: () => void
    onStop: () => void
    onRunAgain: () => void
}) {
    const isFocus = run.dockMode === "focus"

    return (
        <aside
            className={cn(
                "absolute inset-y-5 left-5 z-20 flex flex-col overflow-hidden rounded-[26px] border shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300",
                isFocus
                    ? "w-[min(760px,calc(100%-2.5rem))]"
                    : "w-[min(440px,calc(100%-2.5rem))]"
            )}
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "rgba(255,255,255,0.94)",
            }}
        >
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: "hsl(var(--forge-border))" }}>
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                        Neural run
                    </p>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                            {run.tool.name}
                        </h3>
                        <NeuralRunStatusBadge status={run.status} />
                    </div>
                    <p className="text-sm" style={{ color: "hsl(var(--forge-text-muted))" }}>
                        {run.tool.tagline}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleFocus}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition hover:opacity-85"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            color: "hsl(var(--forge-text-muted))",
                            backgroundColor: "rgba(255,255,255,0.8)",
                        }}
                        aria-label={isFocus ? "Shrink tool panel" : "Expand tool panel"}
                    >
                        {isFocus ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={onCollapse}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition hover:opacity-85"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            color: "hsl(var(--forge-text-muted))",
                            backgroundColor: "rgba(255,255,255,0.8)",
                        }}
                        aria-label="Collapse neural panel"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
                {viewerSamples.length > 0 && (
                    <div
                        className="rounded-2xl border p-4"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "rgba(255,255,255,0.78)",
                        }}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                                <p
                                    className="text-xs font-semibold uppercase tracking-[0.18em]"
                                    style={{ color: "hsl(var(--forge-text-subtle))" }}
                                >
                                    Viewer demo
                                </p>
                                <p
                                    className="text-sm"
                                    style={{ color: "hsl(var(--forge-text-muted))" }}
                                >
                                    Preview the workspace with a local GLB before a real neural result arrives.
                                </p>
                            </div>
                            {run.viewerSource === "demo" && run.viewerLabel && (
                                <span
                                    className="rounded-full border px-3 py-1 text-xs font-medium"
                                    style={{
                                        borderColor: "hsl(var(--forge-border))",
                                        color: "hsl(var(--forge-accent))",
                                        backgroundColor: "hsl(var(--forge-accent-subtle))",
                                    }}
                                >
                                    Loaded: {run.viewerLabel}
                                </span>
                            )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {viewerSamples.slice(0, 3).map((sample) => (
                                <button
                                    key={sample.id}
                                    type="button"
                                    onClick={() => onLoadDemo(sample)}
                                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition hover:opacity-90"
                                    style={{
                                        borderColor: "hsl(var(--forge-border))",
                                        backgroundColor:
                                            run.viewerLabel === sample.name && run.viewerSource === "demo"
                                                ? "hsl(var(--forge-accent-subtle))"
                                                : "rgba(255,255,255,0.9)",
                                        color:
                                            run.viewerLabel === sample.name && run.viewerSource === "demo"
                                                ? "hsl(var(--forge-accent))"
                                                : "hsl(var(--forge-text))",
                                    }}
                                >
                                    {sample.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div
                    className="rounded-2xl border p-4"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        backgroundColor: "hsl(var(--forge-surface-dim))",
                    }}
                >
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
                        {run.tool.description}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3" style={{
                    borderColor: "hsl(var(--forge-border))",
                    backgroundColor: "rgba(255,255,255,0.72)",
                }}>
                    {run.tool.estimatedTime && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--forge-text-muted))" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {run.tool.estimatedTime}
                        </div>
                    )}
                    {run.tool.cost && (
                        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "hsl(var(--forge-text-muted))" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            {run.tool.cost}
                        </div>
                    )}
                    <DifficultyBadge level={run.tool.difficulty} />
                    <ToolTypeBadge type={run.tool.type} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-accent))" }}>
                            Best for
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {run.tool.bestFor.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-lg px-2.5 py-1 text-xs font-medium"
                                    style={{
                                        backgroundColor: "hsl(var(--forge-accent-subtle))",
                                        color: "hsl(var(--forge-accent))",
                                    }}
                                >
                                    ✓ {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    {run.tool.notFor.length > 0 && (
                        <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                Not ideal for
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {run.tool.notFor.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-lg px-2.5 py-1 text-xs font-medium"
                                        style={{
                                            backgroundColor: "hsl(0 0% 95%)",
                                            color: "hsl(var(--forge-text-subtle))",
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {run.status === "running" ? (
                        run.tool.inputs.map((input) => {
                            const value = run.inputs[input.key]
                            if (!value) return null

                            if (input.type === "image") {
                                return (
                                    <div key={input.key} className="space-y-2 md:col-span-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                            {input.label}
                                        </p>
                                        <PreviewImage
                                            src={referenceImage ?? value}
                                            alt={input.label}
                                            className="max-h-52 rounded-2xl border object-contain"
                                            style={{ borderColor: "hsl(var(--forge-border))" }}
                                        />
                                    </div>
                                )
                            }

                            if (input.type === "mesh") {
                                return (
                                    <div key={input.key} className="space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                            {input.label}
                                        </p>
                                        <MeshAttachmentCard
                                            value={value}
                                            emptyMessage="No model is attached yet."
                                        />
                                        {input.helpText && (
                                            <p className="text-xs" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                                {input.helpText}
                                            </p>
                                        )}
                                    </div>
                                )
                            }

                            return (
                                <div key={input.key} className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                        {input.label}
                                    </p>
                                    <div
                                        className="rounded-2xl border px-4 py-3 text-sm leading-relaxed"
                                        style={{
                                            borderColor: "hsl(var(--forge-border))",
                                            backgroundColor: "hsl(var(--forge-surface-dim))",
                                            color: "hsl(var(--forge-text))",
                                        }}
                                    >
                                        {resolveInputDisplayValue(input, run.inputs)}
                                    </div>
                                    {input.helpText && (
                                        <p className="text-xs" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                            {input.helpText}
                                        </p>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="space-y-3 md:col-span-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                    Adjust and run again
                                </p>
                                <p className="mt-1 text-sm" style={{ color: "hsl(var(--forge-text-muted))" }}>
                                    Edit the prompt and inputs here, then rerun this same pipeline step instead of creating a duplicate.
                                </p>
                            </div>
                            <NeuralRerunFields
                                tool={run.tool}
                                inputs={draftInputs}
                                onChange={onDraftInputChange}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                        Status
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
                        {run.status === "running"
                            ? "Generation is running. The prompt is locked until this run finishes or you stop it."
                            : run.error ?? "The latest result stays in the viewer while you adjust the next prompt and rerun this same tool."}
                    </p>
                </div>

                {run.status === "ready" && run.viewerUrl && run.viewerSource === "generated" && (
                    <div
                        className="rounded-2xl border p-4"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "hsl(var(--forge-accent-subtle))",
                        }}
                    >
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-accent))" }}>
                                Suggested next step
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
                                Continue this generated geometry into the texturing stage without re-uploading the mesh.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onContinueToNextTool}
                            className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ backgroundColor: "hsl(var(--forge-accent))" }}
                        >
                            Continue to Hunyuan3D Paint
                        </button>
                    </div>
                )}
            </div>

            <div className="border-t px-5 py-4" style={{ borderColor: "hsl(var(--forge-border))" }}>
                <div className="flex gap-3">
                    {run.status === "running" ? (
                        <button
                            type="button"
                            onClick={onStop}
                            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ backgroundColor: "hsl(0 84% 60%)" }}
                        >
                            <span className="inline-flex items-center gap-2">
                                <Square className="h-4 w-4 fill-current" />
                                Stop
                            </span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onRunAgain}
                            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ backgroundColor: "hsl(var(--forge-accent))" }}
                        >
                            <span className="inline-flex items-center gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Run Again
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}

// ── Main Workspace ──────────────────────────────────────────────

export function StudioWorkspace({
    activeCategory,
    onToolSelect,
    onToolRunNow,
    onNeuralRunStart,
    onNeuralRunUpdate,
    selectedPipelineStep,
    onRequestCategoryChange,
    externalToolLaunch,
}: StudioWorkspaceProps) {
    const [selectedTool, setSelectedTool] = useState<ToolEntry | null>(null)
    const [toolDrafts, setToolDrafts] = useState<Record<string, Record<string, string>>>({})
    const [neuralRun, setNeuralRun] = useState<ActiveNeuralRun | null>(null)
    const [savedNeuralRuns, setSavedNeuralRuns] = useState<Record<string, ActiveNeuralRun>>({})
    const [viewerSamples, setViewerSamples] = useState<ViewerSample[]>([])
    const neuralAbortRef = useRef<AbortController | null>(null)
    const category = CATEGORIES.find(
        (c: CategoryMeta) => c.id === activeCategory
    )
    const tools = getToolsForCategory(activeCategory as StudioCategory)

    // Reset selected tool when category changes
    useEffect(() => {
        neuralAbortRef.current?.abort()
        setSelectedTool((current) =>
            current?.category === activeCategory ? current : null
        )
        setNeuralRun((current) =>
            current?.tool.category === activeCategory ? current : null
        )
    }, [activeCategory])

    useEffect(() => {
        if (!neuralRun) return
        setSavedNeuralRuns((prev) => ({
            ...prev,
            [neuralRun.stepId]: neuralRun,
        }))
        onNeuralRunUpdate(neuralRun.stepId, {
            inputs: neuralRun.inputs,
            neuralState: buildPersistedNeuralState(neuralRun),
            error: neuralRun.error,
        })
    }, [neuralRun, onNeuralRunUpdate])

    useEffect(() => {
        if (!selectedPipelineStep) return
        if (selectedTool) return

        const tool = getToolById(selectedPipelineStep.toolName)
        if (!tool || tool.type !== "neural") return
        const persistedState = selectedPipelineStep.neuralState ?? undefined

        setSelectedTool(null)
        setNeuralRun((current) => {
            if (current?.stepId === selectedPipelineStep.id) return current

            const saved = savedNeuralRuns[selectedPipelineStep.id]
            if (saved) return saved

            return {
                stepId: selectedPipelineStep.id,
                tool,
                inputs: selectedPipelineStep.inputs ?? {},
                draftInputs: persistedState?.draftInputs ?? selectedPipelineStep.inputs ?? {},
                status: mapTimelineStatusToNeuralStatus(selectedPipelineStep.status),
                dockMode: "focus",
                viewerUrl: persistedState?.viewerUrl ?? null,
                viewerLabel: persistedState?.viewerLabel,
                viewerSource: persistedState?.viewerSource,
                error: selectedPipelineStep.error,
                generationTimeMs: persistedState?.generationTimeMs,
            }
        })
    }, [savedNeuralRuns, selectedPipelineStep, selectedTool])

    useEffect(() => {
        return () => {
            neuralAbortRef.current?.abort()
        }
    }, [])

    useEffect(() => {
        if (!externalToolLaunch) return
        const tool = getToolById(externalToolLaunch.toolId)
        if (!tool) return

        neuralAbortRef.current?.abort()
        setNeuralRun(null)
        setToolDrafts((prev) => ({
            ...prev,
            [tool.id]: {
                ...(prev[tool.id] ?? {}),
                ...externalToolLaunch.inputs,
            },
        }))
        setSelectedTool(tool)
    }, [externalToolLaunch])

    useEffect(() => {
        let cancelled = false

        fetch("/api/generate/3d/samples")
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }
                return response.json() as Promise<{ samples?: ViewerSample[] }>
            })
            .then((data) => {
                if (cancelled) return
                setViewerSamples(Array.isArray(data.samples) ? data.samples : [])
            })
            .catch((error) => {
                if (cancelled) return
                console.warn("Failed to load Studio viewer samples", error)
            })

        return () => {
            cancelled = true
        }
    }, [])

    if (!category) return null

    const runNeuralTool = async (tool: ToolEntry, inputs: Record<string, string>, existingStepId?: string) => {
        if (!tool.provider) return

        const stepId = onNeuralRunStart(tool, inputs, existingStepId)
        const imageDataUrl = tool.inputs.find((input) => input.type === "image")
            ? inputs[tool.inputs.find((input) => input.type === "image")?.key ?? ""]
            : undefined
        const resolutionValue = inputs.resolution ? Number(inputs.resolution) : undefined
        const targetFacesValue = inputs.targetFaces ? Number(inputs.targetFaces) : undefined
        const carriedViewerUrl = inputs.meshUrl || null
        const abortController = new AbortController()

        neuralAbortRef.current?.abort()
        neuralAbortRef.current = abortController

        setNeuralRun({
            stepId,
            tool,
            inputs,
            draftInputs: inputs,
            status: "running",
            dockMode: "docked",
            viewerUrl: carriedViewerUrl,
            viewerLabel: carriedViewerUrl ? getAssetDisplayLabel(carriedViewerUrl) : undefined,
            viewerSource: carriedViewerUrl ? "input" : undefined,
        })

        try {
            const response = await fetch("/api/ai/neural-run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: tool.provider,
                    prompt: inputs.prompt,
                    imageDataUrl,
                    meshUrl: inputs.meshUrl,
                    resolution: Number.isFinite(resolutionValue) ? resolutionValue : undefined,
                    textureResolution: inputs.textureResolution,
                    targetFaces: Number.isFinite(targetFacesValue) ? targetFacesValue : undefined,
                }),
                signal: abortController.signal,
            })

            const data = await response.json() as NeuralRunResponse
            if (!response.ok || data.status !== "completed" || !data.viewerUrl) {
                throw new Error(data.error ?? "Neural generation failed")
            }

            setNeuralRun((current) => {
                if (!current || current.stepId !== stepId) return current
                return {
                    ...current,
                    status: "ready",
                    viewerUrl: data.viewerUrl ?? null,
                    viewerLabel: current.viewerSource === "demo" ? current.viewerLabel : `${current.tool.name} result`,
                    viewerSource: "generated",
                    error: undefined,
                    generationTimeMs: data.generationTimeMs,
                }
            })
            onNeuralRunUpdate(stepId, { status: "done" })
        } catch (error) {
            if (abortController.signal.aborted) {
                return
            }

            const message = error instanceof Error ? error.message : "Neural generation failed"
            setNeuralRun((current) => {
                if (!current || current.stepId !== stepId) return current
                return {
                    ...current,
                    status: "failed",
                    error: message,
                }
            })
            onNeuralRunUpdate(stepId, {
                status: "failed",
                error: message,
            })
        } finally {
            if (neuralAbortRef.current === abortController) {
                neuralAbortRef.current = null
            }
        }
    }

    const handleStopNeuralRun = () => {
        if (!neuralRun) return
        neuralAbortRef.current?.abort()
        neuralAbortRef.current = null
        setNeuralRun((current) => {
            if (!current) return current
            return {
                ...current,
                status: "stopped",
                error: "Generation stopped by user.",
            }
        })
        onNeuralRunUpdate(neuralRun.stepId, {
            status: "failed",
            error: "Stopped by user",
        })
    }

    const handleRestoreNeuralPanel = () => {
        setNeuralRun((current) => {
            if (!current) return current
            return { ...current, dockMode: "focus" }
        })
    }

    const handleCollapseNeuralPanel = () => {
        setNeuralRun((current) => {
            if (!current) return current
            return { ...current, dockMode: "collapsed" }
        })
    }

    const handleToggleNeuralFocus = () => {
        setNeuralRun((current) => {
            if (!current) return current
            return {
                ...current,
                dockMode: current.dockMode === "focus" ? "docked" : "focus",
            }
        })
    }

    const handleDraftInputChange = (key: string, value: string) => {
        setNeuralRun((current) => {
            if (!current) return current
            return {
                ...current,
                draftInputs: {
                    ...current.draftInputs,
                    [key]: value,
                },
            }
        })
    }

    const handleRunNeuralAgain = () => {
        if (!neuralRun) return
        void runNeuralTool(neuralRun.tool, neuralRun.draftInputs, neuralRun.stepId)
    }

    const handleLoadDemoSample = (sample: ViewerSample) => {
        setNeuralRun((current) => {
            if (!current) return current
            return {
                ...current,
                viewerUrl: sample.url,
                viewerLabel: sample.name,
                viewerSource: "demo",
            }
        })
    }

    const handleContinueToPaint = () => {
        if (!neuralRun?.viewerUrl) return

        const paintTool = getToolById("hunyuan-paint")
        if (!paintTool) return

        const carriedReference = neuralRun.inputs.imageUrl ?? neuralRun.inputs.referenceImage
        const draft: Record<string, string> = {
            meshUrl: neuralRun.viewerUrl,
        }

        if (carriedReference) {
            draft.imageUrl = carriedReference
        }

        setToolDrafts((prev) => ({
            ...prev,
            [paintTool.id]: draft,
        }))
        setSavedNeuralRuns((prev) =>
            neuralRun ? { ...prev, [neuralRun.stepId]: neuralRun } : prev
        )
        setNeuralRun(null)
        onRequestCategoryChange?.(paintTool.category)
        setSelectedTool(paintTool)
    }

    // ── Detail view ──
    if (neuralRun) {
        const referenceImageKey = neuralRun.tool.inputs.find((input) => input.type === "image")?.key
        const referenceImage = referenceImageKey ? neuralRun.inputs[referenceImageKey] : undefined

        return (
            <div className="relative flex min-h-0 flex-1 overflow-hidden">
                {neuralRun.dockMode === "collapsed" ? (
                    <button
                        type="button"
                        onClick={handleRestoreNeuralPanel}
                        className="absolute left-4 top-24 z-30 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-lg transition hover:opacity-90"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "rgba(255,255,255,0.96)",
                            color: "hsl(var(--forge-text-muted))",
                        }}
                        aria-label="Restore neural panel"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                            Tool panel
                        </span>
                    </button>
                ) : (
                    <NeuralRunOverlay
                        run={neuralRun}
                        referenceImage={referenceImage}
                        viewerSamples={viewerSamples}
                        draftInputs={neuralRun.draftInputs}
                        onLoadDemo={handleLoadDemoSample}
                        onDraftInputChange={handleDraftInputChange}
                        onContinueToNextTool={handleContinueToPaint}
                        onCollapse={handleCollapseNeuralPanel}
                        onToggleFocus={handleToggleNeuralFocus}
                        onStop={handleStopNeuralRun}
                        onRunAgain={handleRunNeuralAgain}
                    />
                )}

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <NeuralViewerStage
                        title={neuralRun.tool.name}
                        status={neuralRun.status}
                        viewerUrl={neuralRun.viewerUrl}
                        viewerLabel={neuralRun.viewerLabel}
                        viewerSource={neuralRun.viewerSource}
                        error={neuralRun.error}
                        generationTimeMs={neuralRun.generationTimeMs}
                    />
                </div>
            </div>
        )
    }

    if (selectedTool) {
        return (
            <ToolDetailView
                key={selectedTool.id}
                tool={selectedTool}
                initialInputs={toolDrafts[selectedTool.id]}
                onBack={() => setSelectedTool(null)}
                onSubmit={(tool, inputs) => {
                    onToolSelect(tool, inputs)
                    setToolDrafts((prev) => ({ ...prev, [tool.id]: inputs }))
                    setSelectedTool(null)
                }}
                onRunNow={(tool, inputs) => {
                    setToolDrafts((prev) => ({ ...prev, [tool.id]: inputs }))
                    if (tool.type === "neural") {
                        void runNeuralTool(tool, inputs)
                    } else {
                        onToolRunNow(tool, inputs)
                    }
                    setSelectedTool(null)
                }}
            />
        )
    }

    // ── Grid view ──
    return (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 xl:p-8">
            <div className="mb-6">
                <h2
                    className="text-2xl font-bold"
                    style={{ color: "hsl(var(--forge-text))" }}
                >
                    {category.label}
                </h2>
                <p
                    className="text-sm mt-1"
                    style={{ color: "hsl(var(--forge-text-muted))" }}
                >
                    {category.description}
                </p>
                <p
                    className="text-xs mt-2"
                    style={{ color: "hsl(var(--forge-text-subtle))" }}
                >
                    {category.helpText}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {tools.map((tool: ToolEntry) => (
                    <ToolCardCompact
                        key={tool.id}
                        tool={tool}
                        onOpen={() => setSelectedTool(tool)}
                    />
                ))}
            </div>

            {tools.length === 0 && (
                <div
                    className="flex flex-col items-center justify-center py-16 rounded-2xl border"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        backgroundColor: "hsl(var(--forge-surface-dim))",
                    }}
                >
                    <p style={{ color: "hsl(var(--forge-text-muted))" }}>
                        No tools available for this category yet.
                    </p>
                </div>
            )}
        </div>
    )
}
