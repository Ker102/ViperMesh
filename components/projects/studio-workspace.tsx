"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, RefreshCw, SlidersHorizontal, Square } from "lucide-react"
import { HeavyModelViewer } from "@/components/generation/HeavyModelViewer"
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
import { AssetPreviewTile, AssetStatsPanel, AssetStatsPills } from "./asset-inspection"
import {
    buildNextSuggestionsForAsset,
    isRenderablePreviewImage,
    type GeneratedAssetItem,
} from "./generated-assets"
import type { AssetInspectionStats, WorkflowTimelineNeuralState, WorkflowTimelineStep } from "./workflow-timeline"

interface StudioWorkspaceProps {
    activeCategory: string
    onToolSelect: (tool: ToolEntry, inputs: Record<string, string>) => void
    onToolRunNow: (tool: ToolEntry, inputs: Record<string, string>) => void
    onNeuralRunStart: (tool: ToolEntry, inputs: Record<string, string>, existingStepId?: string) => string
    onNeuralRunUpdate: (stepId: string, patch: Partial<Pick<WorkflowTimelineStep, "status" | "error" | "inputs" | "neuralState">>) => void
    selectedPipelineStep?: WorkflowTimelineStep | null
    onRequestCategoryChange?: (category: StudioCategory) => void
    onOpenAssetLibrary: () => void
    onRequestLibrarySelection: (selection: { token: string; label: string }) => void
    incomingLibrarySelection?: {
        token: string
        asset: GeneratedAssetItem
    } | null
    onConsumeLibrarySelection: (token: string) => void
    generatedAssets: GeneratedAssetItem[]
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
    assetStats?: AssetInspectionStats | null
    assetOrigin?: "generated" | "imported"
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
        assetStats: run.assetStats ?? null,
        assetOrigin: run.assetOrigin ?? undefined,
    }
}

interface PendingMeshSelection {
    token: string
    target: "tool" | "neural"
    toolId: string
    inputKey: string
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

function getImageInputKey(tool: ToolEntry): string | undefined {
    return tool.inputs.find((input) => input.type === "image")?.key
}

function getMeshInputKey(tool: ToolEntry): string | undefined {
    return tool.inputs.find((input) => input.type === "mesh")?.key
}

function formatStageLabel(category: string): string {
    switch (category) {
        case "shape":
            return "Geometry"
        case "cleanup":
            return "Cleanup"
        case "paint":
            return "Texturing"
        case "skeleton":
            return "Rigging"
        case "export":
            return "Export"
        default:
            return category.charAt(0).toUpperCase() + category.slice(1)
    }
}

function formatProviderLabel(rawProvider?: string): string | undefined {
    if (!rawProvider) return undefined
    const normalized = rawProvider.replace(/-/g, " ")
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildAssetStatsSeed(tool: ToolEntry): AssetInspectionStats {
    return {
        sourceToolId: tool.id,
        sourceToolLabel: tool.name,
        sourceProvider: formatProviderLabel(tool.provider),
        stageLabel: formatStageLabel(tool.category),
    }
}

function findGeneratedAssetByUrl(assets: GeneratedAssetItem[], viewerUrl?: string | null): GeneratedAssetItem | null {
    if (!viewerUrl) return null
    return assets.find((asset) => asset.viewerUrl === viewerUrl) ?? null
}

function extractNeuralOutputRelativePath(candidateUrl: string): string | null {
    try {
        const baseUrl =
            typeof window !== "undefined"
                ? window.location.origin
                : "http://127.0.0.1"
        const parsed = new URL(candidateUrl, baseUrl)
        const relativePath = parsed.searchParams.get("path")
        return relativePath ? decodeURIComponent(relativePath) : null
    } catch {
        return null
    }
}

function mergeAssetStats(
    tool: ToolEntry,
    stats?: Partial<AssetInspectionStats> | null,
    linkedAsset?: GeneratedAssetItem | null,
): AssetInspectionStats {
    return {
        ...buildAssetStatsSeed(tool),
        ...(linkedAsset?.assetStats ?? {}),
        sourceToolId: linkedAsset?.assetStats?.sourceToolId ?? linkedAsset?.toolName ?? tool.id,
        sourceToolLabel: linkedAsset?.assetStats?.sourceToolLabel ?? linkedAsset?.toolLabel ?? tool.name,
        sourceProvider: linkedAsset?.assetStats?.sourceProvider ?? linkedAsset?.providerLabel ?? formatProviderLabel(tool.provider),
        stageLabel: linkedAsset?.assetStats?.stageLabel ?? linkedAsset?.stageLabel ?? formatStageLabel(tool.category),
        ...(stats ?? {}),
    }
}

function getMeshPreviewImage(
    tool: ToolEntry,
    inputs: Record<string, string>,
    linkedAsset?: GeneratedAssetItem | null,
): string | undefined {
    if (isRenderablePreviewImage(linkedAsset?.previewImageUrl)) {
        return linkedAsset.previewImageUrl
    }

    const imageKey = getImageInputKey(tool)
    if (!imageKey) return undefined
    const candidate = inputs[imageKey]
    return isRenderablePreviewImage(candidate) ? candidate : undefined
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
    previewImageUrl,
    assetStats,
    stageLabel,
    providerLabel,
    onChooseModel,
}: {
    value?: string
    emptyMessage: string
    description?: string
    previewImageUrl?: string
    assetStats?: AssetInspectionStats | null
    stageLabel?: string
    providerLabel?: string
    onChooseModel?: () => void
}) {
    if (!value) {
        return (
            <div className="space-y-3">
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
                {onChooseModel && (
                    <button
                        type="button"
                        onClick={onChooseModel}
                        className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            color: "hsl(var(--forge-text-muted))",
                        }}
                    >
                        Choose from Asset Library
                    </button>
                )}
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
                    className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        background:
                            "radial-gradient(circle at top, rgba(45,212,191,0.22), rgba(15,23,42,0.92) 65%)",
                    }}
                >
                    <AssetPreviewTile
                        imageUrl={previewImageUrl}
                        alt="Attached model preview"
                        stageLabel={stageLabel}
                        providerLabel={providerLabel}
                        className="h-full w-full"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                        Attached model
                    </p>
                    <p className="mt-1 text-sm font-medium" style={{ color: "hsl(var(--forge-text))" }}>
                        {getAssetDisplayLabel(value)}
                    </p>
                    {(stageLabel || providerLabel) && (
                        <p className="mt-1 text-xs" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                            {[stageLabel, providerLabel].filter(Boolean).join(" • ")}
                        </p>
                    )}
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
                        {description ?? "This tool will use the current project model as its source mesh."}
                    </p>
                    <AssetStatsPills stats={assetStats} className="mt-3 flex flex-wrap gap-2" />
                    {onChooseModel && (
                        <button
                            type="button"
                            onClick={onChooseModel}
                            className="mt-3 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                color: "hsl(var(--forge-text-muted))",
                            }}
                        >
                            Change attached model
                        </button>
                    )}
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
    inputs,
    onInputChange,
    generatedAssets,
    onRequestMeshSelection,
}: {
    tool: ToolEntry
    onBack: () => void
    onSubmit: (tool: ToolEntry, inputs: Record<string, string>) => void
    onRunNow: (tool: ToolEntry, inputs: Record<string, string>) => void
    inputs: Record<string, string>
    onInputChange: (key: string, value: string) => void
    generatedAssets: GeneratedAssetItem[]
    onRequestMeshSelection: (inputKey: string, currentInputs: Record<string, string>) => void
}) {
    const handleSubmit = () => {
        onSubmit(tool, inputs)
    }

    const handleRunNow = () => {
        onRunNow(tool, inputs)
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
                                        onChange={(e) => onInputChange(input.key, e.target.value)}
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
                                        onChange={(e) => onInputChange(input.key, e.target.value)}
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
                                        emptyMessage="No model is attached yet. Pick one from the project asset library or import a GLB there first."
                                        previewImageUrl={getMeshPreviewImage(
                                            tool,
                                            inputs,
                                            findGeneratedAssetByUrl(generatedAssets, inputs[input.key]),
                                        )}
                                        assetStats={findGeneratedAssetByUrl(generatedAssets, inputs[input.key])?.assetStats}
                                        stageLabel={findGeneratedAssetByUrl(generatedAssets, inputs[input.key])?.stageLabel}
                                        providerLabel={findGeneratedAssetByUrl(generatedAssets, inputs[input.key])?.providerLabel}
                                        onChooseModel={() => onRequestMeshSelection(input.key, inputs)}
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
                                                    onClick={() => onInputChange(input.key, "")}
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
                                                            onInputChange(input.key, reader.result as string)
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
                                            onChange={(e) => onInputChange(input.key, e.target.value)}
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

                        <div className="mt-4">
                            <div className="flex gap-3">
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

function buildToolLaunchInputs(tool: ToolEntry, meshUrl: string, referenceImage?: string): Record<string, string> {
    const inputs: Record<string, string> = {}
    const meshInputKey = getMeshInputKey(tool)
    const imageInputKey = getImageInputKey(tool)
    if (meshInputKey) {
        inputs[meshInputKey] = meshUrl
    }
    if (referenceImage && imageInputKey) {
        inputs[imageInputKey] = referenceImage
    }
    return inputs
}

function NeuralViewerStage({
    title,
    status,
    viewerUrl,
    viewerLabel,
    viewerSource,
    error,
    generationTimeMs,
    assetStats,
}: {
    title: string
    status: NeuralRunStatus
    viewerUrl: string | null
    viewerLabel?: string
    viewerSource?: NeuralViewerSource
    error?: string
    generationTimeMs?: number
    assetStats?: AssetInspectionStats | null
}) {
    const [inspectionMode, setInspectionMode] = useState<"material" | "geometry" | "solid" | "toon" | "wireframe" | "stats">("material")
    const [inspectionTint, setInspectionTint] = useState<"neutral" | "violet" | "cyan">("neutral")
    const [shadingMode, setShadingMode] = useState<"smooth" | "flat">("smooth")
    const [pbrEnabled, setPbrEnabled] = useState(true)
    const [unlitEnabled, setUnlitEnabled] = useState(false)
    const [toonEdgesEnabled, setToonEdgesEnabled] = useState(true)
    const [meshEdgesEnabled, setMeshEdgesEnabled] = useState(false)
    const [previewMetalness, setPreviewMetalness] = useState(0.5)
    const [previewRoughness, setPreviewRoughness] = useState(0.55)
    const [showViewSettings, setShowViewSettings] = useState(false)
    const displayViewerLabel =
        viewerSource === "input" && viewerUrl
            ? getAssetDisplayLabel(viewerUrl)
            : viewerLabel
    const metadataSummary = [assetStats?.stageLabel, assetStats?.sourceProvider].filter(Boolean).join(" • ")
    const activeInspectionLabel = {
        material: "Texture",
        toon: "Toon",
        geometry: "Geometry",
        solid: "Solid",
        wireframe: "Wireframe",
        stats: "Stats",
    }[inspectionMode]
    const supportsShadingControls =
        inspectionMode === "material" ||
        inspectionMode === "toon" ||
        inspectionMode === "geometry" ||
        inspectionMode === "solid"
    const supportsTintControls = inspectionMode === "geometry" || inspectionMode === "wireframe"
    const supportsMaterialControls = inspectionMode === "material"
    const supportsLightingControls = inspectionMode === "material" || inspectionMode === "solid"
    const shadingControlsEnabled = !((inspectionMode === "material" || inspectionMode === "solid") && unlitEnabled)

    const viewSettingsOpen = showViewSettings && Boolean(viewerUrl) && inspectionMode !== "stats"

    return (
        <div
            className="relative flex min-h-0 flex-1 overflow-hidden"
            style={{
                backgroundColor: "hsl(var(--forge-surface-dim))",
            }}
        >
            {viewerUrl ? (
                <HeavyModelViewer
                    url={viewerUrl}
                    className="h-full min-h-0 rounded-none border-0"
                    inspectionMode={inspectionMode === "stats" ? "material" : inspectionMode}
                    inspectionTint={inspectionTint}
                    shadingMode={shadingMode}
                    pbrEnabled={pbrEnabled}
                    unlitEnabled={unlitEnabled}
                    toonEdgesEnabled={toonEdgesEnabled}
                    meshEdgesEnabled={meshEdgesEnabled}
                    previewMetalness={previewMetalness}
                    previewRoughness={previewRoughness}
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

            {inspectionMode === "stats" && viewerUrl && (
                <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4">
                    <div className="pointer-events-auto w-[min(340px,calc(100%-2rem))]">
                        <AssetStatsPanel stats={assetStats} />
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

            <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-slate-50/82 via-slate-100/28 to-transparent px-6 pb-8 pt-5 sm:pr-[22rem]">
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
                    {(metadataSummary || assetStats) && (
                        <div className="pointer-events-auto mt-3 max-w-[44rem] space-y-2">
                            {metadataSummary && (
                                <p
                                    className="text-xs font-medium"
                                    style={{ color: "hsl(var(--forge-text-muted))" }}
                                >
                                    {metadataSummary}
                                </p>
                            )}
                            <AssetStatsPills stats={assetStats} className="flex flex-wrap gap-2" />
                        </div>
                    )}
                </div>
            </div>

            {viewerUrl && (
                <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-6">
                    <div className="pointer-events-auto flex flex-col items-center gap-2">
                        {viewSettingsOpen && (
                            <div
                                className="w-[min(360px,calc(100vw-3rem))] rounded-3xl border px-4 py-4 text-[11px] font-medium shadow-2xl backdrop-blur"
                                style={{
                                    borderColor: "rgba(255,255,255,0.14)",
                                    backgroundColor: "rgba(15, 23, 42, 0.84)",
                                    color: "rgba(241,245,249,0.96)",
                                }}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: "rgba(148,163,184,0.95)" }}>
                                            View settings
                                        </p>
                                        <p className="mt-1 text-sm font-semibold">{activeInspectionLabel}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowViewSettings(false)}
                                        className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition"
                                        style={{
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            color: "rgba(226,232,240,0.82)",
                                        }}
                                    >
                                        Hide
                                    </button>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {supportsShadingControls && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.95)" }}>
                                                Shading
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: "smooth", label: "Smooth" },
                                                    { id: "flat", label: "Flat" },
                                                ].map((option) => {
                                                    const active = shadingMode === option.id
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            onClick={() => setShadingMode(option.id as "smooth" | "flat")}
                                                            disabled={!shadingControlsEnabled}
                                                            className="rounded-2xl px-3 py-2 text-sm font-semibold transition"
                                                            style={active
                                                                ? {
                                                                    backgroundColor: "rgba(96,165,250,0.24)",
                                                                    color: "white",
                                                                    opacity: shadingControlsEnabled ? 1 : 0.45,
                                                                }
                                                                : {
                                                                    backgroundColor: "rgba(255,255,255,0.05)",
                                                                    color: "rgba(226,232,240,0.84)",
                                                                    opacity: shadingControlsEnabled ? 1 : 0.45,
                                                                }}
                                                            title={shadingControlsEnabled ? `${option.label} shading` : "Disabled while unlit is on"}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {supportsLightingControls && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                {supportsMaterialControls && (
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.95)" }}>
                                                            PBR
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPbrEnabled((current) => !current)}
                                                            className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition"
                                                            style={pbrEnabled
                                                                ? {
                                                                    backgroundColor: "rgba(45,212,191,0.2)",
                                                                    color: "white",
                                                                }
                                                                : {
                                                                    backgroundColor: "rgba(255,255,255,0.05)",
                                                                    color: "rgba(226,232,240,0.84)",
                                                                }}
                                                            title="Toggle PBR shading"
                                                        >
                                                            <span>Physical</span>
                                                            <span>{pbrEnabled ? "On" : "Off"}</span>
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.95)" }}>
                                                        Unlit
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setUnlitEnabled((current) => {
                                                                const next = !current
                                                                if (!next && (inspectionMode === "material" || inspectionMode === "solid")) {
                                                                    setShadingMode("smooth")
                                                                }
                                                                return next
                                                            })
                                                        }}
                                                        className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition"
                                                        style={unlitEnabled
                                                            ? { backgroundColor: "rgba(147,197,253,0.22)", color: "white" }
                                                            : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(226,232,240,0.84)" }}
                                                    >
                                                        <span>Lighting</span>
                                                        <span>{unlitEnabled ? "Off" : "On"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                            {supportsMaterialControls && pbrEnabled && !unlitEnabled && (
                                                <div className="space-y-3 rounded-2xl border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                                                    <label className="flex items-center gap-3">
                                                        <span className="w-16 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.95)" }}>
                                                            Metallic
                                                        </span>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={1}
                                                            step={0.05}
                                                            value={previewMetalness}
                                                            onChange={(event) => setPreviewMetalness(Number(event.target.value))}
                                                            className="flex-1"
                                                        />
                                                        <span className="w-8 text-right tabular-nums">{previewMetalness.toFixed(2)}</span>
                                                    </label>
                                                    <label className="flex items-center gap-3">
                                                        <span className="w-16 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.95)" }}>
                                                            Roughness
                                                        </span>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={1}
                                                            step={0.05}
                                                            value={previewRoughness}
                                                            onChange={(event) => setPreviewRoughness(Number(event.target.value))}
                                                            className="flex-1"
                                                        />
                                                        <span className="w-8 text-right tabular-nums">{previewRoughness.toFixed(2)}</span>
                                                    </label>
                                                </div>
                                            )}
                                            {supportsMaterialControls && pbrEnabled && unlitEnabled && (
                                                <p className="rounded-2xl border px-3 py-2 text-xs leading-relaxed" style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(203,213,225,0.82)" }}>
                                                    Metallic and roughness controls apply when Lighting is on.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {inspectionMode === "toon" && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.95)" }}>
                                                Style
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setToonEdgesEnabled((current) => !current)}
                                                className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition"
                                                style={toonEdgesEnabled
                                                    ? { backgroundColor: "rgba(147,197,253,0.22)", color: "white" }
                                                    : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(226,232,240,0.84)" }}
                                                title="Toggle toon mesh ink lines"
                                            >
                                                <span>Ink lines</span>
                                                <span>{toonEdgesEnabled ? "On" : "Off"}</span>
                                            </button>
                                        </div>
                                    )}
                                    {inspectionMode === "solid" && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.95)" }}>
                                                Topology
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setMeshEdgesEnabled((current) => !current)}
                                                className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition"
                                                style={meshEdgesEnabled
                                                    ? { backgroundColor: "rgba(147,197,253,0.22)", color: "white" }
                                                    : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(226,232,240,0.84)" }}
                                                title="Show triangle edges over the solid preview"
                                            >
                                                <span>Show edges</span>
                                                <span>{meshEdgesEnabled ? "On" : "Off"}</span>
                                            </button>
                                        </div>
                                    )}
                                    {supportsTintControls && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.95)" }}>
                                                Tint
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {[
                                                    { id: "neutral", label: "Neutral tint", color: "#d4d4d8" },
                                                    { id: "violet", label: "Violet tint", color: "#e879f9" },
                                                    { id: "cyan", label: "Cyan tint", color: "#67e8f9" },
                                                ].map((tint) => {
                                                    const active = inspectionTint === tint.id
                                                    return (
                                                        <button
                                                            key={tint.id}
                                                            type="button"
                                                            onClick={() => setInspectionTint(tint.id as "neutral" | "violet" | "cyan")}
                                                            className="h-8 w-8 rounded-full border transition"
                                                            aria-label={tint.label}
                                                            title={tint.label}
                                                            style={{
                                                                backgroundColor: tint.color,
                                                                borderColor: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                                                                boxShadow: active ? "0 0 0 2px rgba(15,23,42,0.35)" : "none",
                                                            }}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div
                            className="inline-flex items-center gap-1 rounded-full border px-1 py-1 shadow-lg backdrop-blur"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "rgba(15, 23, 42, 0.78)",
                            }}
                        >
                        {[
                            {
                                id: "material",
                                label: "Texture",
                                icon: (
                                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                                        <path d="M4.5 11.8C3.4 10.6 3 9.55 3 8.25C3 5.35 5.35 3 8.25 3c1.2 0 2.22.34 3.36 1.28c1 .82 2.12 1.16 3.06 1.16c1.26 0 2.33.88 2.33 2.17c0 5.15-4.17 9.39-9.31 9.39c-2.06 0-3.69-1.3-3.69-3.05c0-.8.24-1.46.5-2.15Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="8" cy="7.2" r="1" fill="currentColor" />
                                        <circle cx="11.4" cy="5.9" r=".9" fill="currentColor" />
                                        <circle cx="12.7" cy="9" r=".9" fill="currentColor" />
                                    </svg>
                                ),
                            },
                            {
                                id: "toon",
                                label: "Toon",
                                icon: (
                                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                                        <path d="M4 13.5c0-3.9 2.4-7 6-7s6 3.1 6 7c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3Z" stroke="currentColor" strokeWidth="1.6" />
                                        <path d="M7 11.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                        <path d="M8.25 8.5h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                            {
                                id: "geometry",
                                label: "Geometry",
                                icon: (
                                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                                        <path d="M10 3l6 3.5v7L10 17l-6-3.5v-7L10 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                                        <path d="M4 6.5L10 10m6-3.5L10 10m0 0v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ),
                            },
                            {
                                id: "solid",
                                label: "Solid",
                                icon: (
                                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                                        <path d="M10 3.5c3.58 0 6.5 2.92 6.5 6.5s-2.92 6.5-6.5 6.5S3.5 13.58 3.5 10 6.42 3.5 10 3.5Z" stroke="currentColor" strokeWidth="1.6" />
                                        <path d="M10 3.5A6.5 6.5 0 0 1 16.5 10H10V3.5Z" fill="currentColor" fillOpacity=".28" />
                                    </svg>
                                ),
                            },
                            {
                                id: "wireframe",
                                label: "Wireframe",
                                icon: (
                                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                                        <path d="M10 3l6 3.5v7L10 17l-6-3.5v-7L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                        <path d="M4 6.5 10 10l6-3.5M10 10v7M4 13.5 10 10l6 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ),
                            },
                            {
                                id: "stats",
                                label: "Stats",
                                icon: (
                                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                                        <path d="M4 15.5V10m4 5.5V7.5m4 8V11m4 4.5V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                        ].map((mode) => {
                            const active = inspectionMode === mode.id
                            return (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => {
                                        const nextMode = mode.id as "material" | "geometry" | "solid" | "toon" | "wireframe" | "stats"
                                        setInspectionMode(nextMode)
                                        if ((nextMode === "material" || nextMode === "solid") && !unlitEnabled) {
                                            setShadingMode("smooth")
                                        }
                                    }}
                                    className="rounded-full p-2.5 transition"
                                    aria-label={mode.label}
                                    title={mode.label}
                                    style={active
                                        ? {
                                            backgroundColor: "rgba(255,255,255,0.18)",
                                            color: "white",
                                        }
                                        : {
                                            color: "rgba(226,232,240,0.86)",
                                        }}
                                >
                                    {mode.icon}
                                </button>
                            )
                        })}
                        <span className="mx-1 h-6 w-px" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
                        <button
                            type="button"
                            onClick={() => setShowViewSettings((current) => !current)}
                            className="rounded-full p-2.5 transition"
                            aria-label="View settings"
                            title="View settings"
                            style={showViewSettings
                                ? {
                                    backgroundColor: "rgba(255,255,255,0.18)",
                                    color: "white",
                                }
                                : {
                                    color: "rgba(226,232,240,0.86)",
                                }}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                        </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function NeuralRerunFields({
    tool,
    inputs,
    generatedAssets,
    onChange,
    onRequestMeshSelection,
}: {
    tool: ToolEntry
    inputs: Record<string, string>
    generatedAssets: GeneratedAssetItem[]
    onChange: (key: string, value: string) => void
    onRequestMeshSelection: (inputKey: string, currentInputs: Record<string, string>) => void
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
                            emptyMessage="No model is attached yet. Pick one from the project asset library or import a GLB there first."
                            previewImageUrl={getMeshPreviewImage(
                                tool,
                                inputs,
                                findGeneratedAssetByUrl(generatedAssets, inputs[input.key]),
                            )}
                            assetStats={findGeneratedAssetByUrl(generatedAssets, inputs[input.key])?.assetStats}
                            stageLabel={findGeneratedAssetByUrl(generatedAssets, inputs[input.key])?.stageLabel}
                            providerLabel={findGeneratedAssetByUrl(generatedAssets, inputs[input.key])?.providerLabel}
                            onChooseModel={() => onRequestMeshSelection(input.key, inputs)}
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
    generatedAssets,
    onLoadDemo,
    onDraftInputChange,
    onRequestMeshSelection,
    onContinueToSuggestedTool,
    onCollapse,
    onToggleFocus,
    onStop,
    onRunAgain,
}: {
    run: ActiveNeuralRun
    referenceImage?: string
    viewerSamples: ViewerSample[]
    draftInputs: Record<string, string>
    generatedAssets: GeneratedAssetItem[]
    onLoadDemo: (sample: ViewerSample) => void
    onDraftInputChange: (key: string, value: string) => void
    onRequestMeshSelection: (inputKey: string, currentInputs: Record<string, string>) => void
    onContinueToSuggestedTool: (toolId: string) => void
    onCollapse: () => void
    onToggleFocus: () => void
    onStop: () => void
    onRunAgain: () => void
}) {
    const isFocus = run.dockMode === "focus"
    const nextSuggestions = run.status === "ready" && run.viewerUrl && run.viewerSource === "generated"
        ? buildNextSuggestionsForAsset(run.tool.id, run.inputs)
        : []

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
                                            previewImageUrl={getMeshPreviewImage(
                                                run.tool,
                                                run.inputs,
                                                findGeneratedAssetByUrl(generatedAssets, value),
                                            )}
                                            assetStats={findGeneratedAssetByUrl(generatedAssets, value)?.assetStats}
                                            stageLabel={findGeneratedAssetByUrl(generatedAssets, value)?.stageLabel}
                                            providerLabel={findGeneratedAssetByUrl(generatedAssets, value)?.providerLabel}
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
                                generatedAssets={generatedAssets}
                                onChange={onDraftInputChange}
                                onRequestMeshSelection={onRequestMeshSelection}
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

                {nextSuggestions.length > 0 && (
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
                                Move this asset to the next stage without re-uploading the mesh or rebuilding the pipeline context.
                            </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {nextSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion.toolId}
                                    type="button"
                                    onClick={() => onContinueToSuggestedTool(suggestion.toolId)}
                                    className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                                    style={suggestion.variant === "primary"
                                        ? {
                                            backgroundColor: "hsl(var(--forge-accent))",
                                            color: "white",
                                        }
                                        : {
                                            borderColor: "hsl(var(--forge-border))",
                                            borderWidth: "1px",
                                            backgroundColor: "rgba(255,255,255,0.74)",
                                            color: "hsl(var(--forge-text-muted))",
                                        }}
                                    title={suggestion.description}
                                >
                                    {suggestion.label}
                                </button>
                            ))}
                        </div>
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
    onOpenAssetLibrary,
    onRequestLibrarySelection,
    incomingLibrarySelection,
    onConsumeLibrarySelection,
    generatedAssets,
    externalToolLaunch,
}: StudioWorkspaceProps) {
    const [selectedTool, setSelectedTool] = useState<ToolEntry | null>(null)
    const [toolDrafts, setToolDrafts] = useState<Record<string, Record<string, string>>>({})
    const [neuralRun, setNeuralRun] = useState<ActiveNeuralRun | null>(null)
    const [savedNeuralRuns, setSavedNeuralRuns] = useState<Record<string, ActiveNeuralRun>>({})
    const [viewerSamples, setViewerSamples] = useState<ViewerSample[]>([])
    const [pendingMeshSelection, setPendingMeshSelection] = useState<PendingMeshSelection | null>(null)
    const neuralAbortRef = useRef<AbortController | null>(null)
    const handledExternalLaunchTokenRef = useRef<string | null>(null)
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
        if (!selectedTool || selectedTool.type === "blender_agent" || !getMeshInputKey(selectedTool)) return
        const meshInputKey = getMeshInputKey(selectedTool)
        if (meshInputKey && toolDrafts[selectedTool.id]?.[meshInputKey]) return
        onOpenAssetLibrary()
    }, [onOpenAssetLibrary, selectedTool, toolDrafts])

    useEffect(() => {
        if (!incomingLibrarySelection || !pendingMeshSelection) return
        if (incomingLibrarySelection.token !== pendingMeshSelection.token) return

        const nextUrl = incomingLibrarySelection.asset.viewerUrl

        if (pendingMeshSelection.target === "tool") {
            setToolDrafts((prev) => ({
                ...prev,
                [pendingMeshSelection.toolId]: {
                    ...(prev[pendingMeshSelection.toolId] ?? {}),
                    [pendingMeshSelection.inputKey]: nextUrl,
                },
            }))
        } else {
            setNeuralRun((current) => {
                if (!current || current.tool.id !== pendingMeshSelection.toolId) {
                    return current
                }

                return {
                    ...current,
                    inputs: {
                        ...current.inputs,
                        [pendingMeshSelection.inputKey]: nextUrl,
                    },
                    draftInputs: {
                        ...current.draftInputs,
                        [pendingMeshSelection.inputKey]: nextUrl,
                    },
                }
            })
        }

        setPendingMeshSelection(null)
        onConsumeLibrarySelection(incomingLibrarySelection.token)
    }, [incomingLibrarySelection, onConsumeLibrarySelection, pendingMeshSelection])

    useEffect(() => {
        if (!selectedPipelineStep) return
        if (selectedTool) return

        const tool = getToolById(selectedPipelineStep.toolName)
        const persistedState = selectedPipelineStep.neuralState ?? undefined
        const isImportedAsset = persistedState?.assetOrigin === "imported"
        if (!tool || (!isImportedAsset && tool.type !== "neural")) return

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
                assetStats: persistedState?.assetStats,
                assetOrigin: persistedState?.assetOrigin,
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
        if (handledExternalLaunchTokenRef.current === externalToolLaunch.token) return

        const tool = getToolById(externalToolLaunch.toolId)
        if (!tool) return

        handledExternalLaunchTokenRef.current = externalToolLaunch.token
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

    const runNeuralTool = async (tool: ToolEntry, inputs: Record<string, string>, existingStepId?: string) => {
        if (!tool.provider) return

        const stepId = onNeuralRunStart(tool, inputs, existingStepId)
        const imageInputKey = getImageInputKey(tool)
        const meshInputKey = getMeshInputKey(tool)
        const imageDataUrl = imageInputKey ? inputs[imageInputKey] : undefined
        const resolutionValue = inputs.resolution ? Number(inputs.resolution) : undefined
        const targetFacesValue = inputs.targetFaces ? Number(inputs.targetFaces) : undefined
        const carriedViewerUrl = meshInputKey ? inputs[meshInputKey] || null : null
        const linkedAsset = findGeneratedAssetByUrl(generatedAssets, carriedViewerUrl)
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
            assetStats: carriedViewerUrl ? mergeAssetStats(tool, undefined, linkedAsset) : mergeAssetStats(tool),
        })

        try {
            const response = await fetch("/api/ai/neural-run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: tool.provider,
                    prompt: inputs.prompt,
                    imageDataUrl,
                    meshUrl: meshInputKey ? inputs[meshInputKey] : undefined,
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
                    assetStats: mergeAssetStats(current.tool),
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

    const requestToolMeshSelection = useCallback((toolId: string, inputKey: string, currentInputs: Record<string, string>) => {
        const token = `tool-mesh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        setToolDrafts((prev) => ({
            ...prev,
            [toolId]: {
                ...(prev[toolId] ?? {}),
                ...currentInputs,
            },
        }))
        setPendingMeshSelection({
            token,
            target: "tool",
            toolId,
            inputKey,
        })
        onRequestLibrarySelection({
            token,
            label: getToolById(toolId)?.name ?? "current tool",
        })
    }, [onRequestLibrarySelection])

    const requestNeuralMeshSelection = useCallback((toolId: string, inputKey: string, currentInputs: Record<string, string>) => {
        const token = `neural-mesh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        setNeuralRun((current) => {
            if (!current || current.tool.id !== toolId) return current
            return {
                ...current,
                draftInputs: {
                    ...current.draftInputs,
                    ...currentInputs,
                },
            }
        })
        setPendingMeshSelection({
            token,
            target: "neural",
            toolId,
            inputKey,
        })
        onRequestLibrarySelection({
            token,
            label: getToolById(toolId)?.name ?? "current tool",
        })
    }, [onRequestLibrarySelection])

    useEffect(() => {
        if (!selectedTool || selectedTool.type === "blender_agent") return
        const meshInputKey = getMeshInputKey(selectedTool)
        if (!meshInputKey) return
        const currentDraft = toolDrafts[selectedTool.id] ?? {}
        if (currentDraft[meshInputKey]) return
        if (
            pendingMeshSelection?.target === "tool" &&
            pendingMeshSelection.toolId === selectedTool.id &&
            pendingMeshSelection.inputKey === meshInputKey
        ) {
            return
        }

        requestToolMeshSelection(selectedTool.id, meshInputKey, currentDraft)
    }, [pendingMeshSelection, requestToolMeshSelection, selectedTool, toolDrafts])

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
                assetStats: null,
            }
        })
    }

    useEffect(() => {
        if (!neuralRun?.viewerUrl || neuralRun.viewerSource === "demo") return

        const linkedAsset = findGeneratedAssetByUrl(generatedAssets, neuralRun.viewerUrl)
        if (linkedAsset?.assetStats && !neuralRun.assetStats) {
            setNeuralRun((current) => {
                if (!current || current.viewerUrl !== neuralRun.viewerUrl || current.assetStats) {
                    return current
                }
                return {
                    ...current,
                    assetStats: mergeAssetStats(current.tool, linkedAsset.assetStats, linkedAsset),
                }
            })
            return
        }

        if (neuralRun.assetStats?.triangleCount != null || neuralRun.assetStats?.fileSizeBytes != null) {
            return
        }

        const relativePath = extractNeuralOutputRelativePath(neuralRun.viewerUrl)
        if (!relativePath) return

        const abortController = new AbortController()

        fetch(`/api/ai/neural-output/stats?path=${encodeURIComponent(relativePath)}`, {
            signal: abortController.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }
                return response.json() as Promise<{ stats?: Partial<AssetInspectionStats> }>
            })
            .then((payload) => {
                if (!payload.stats) return
                setNeuralRun((current) => {
                    if (!current || current.viewerUrl !== neuralRun.viewerUrl) {
                        return current
                    }
                    return {
                        ...current,
                        assetStats: mergeAssetStats(current.tool, payload.stats, linkedAsset),
                    }
                })
            })
            .catch((statsError) => {
                if (!(statsError instanceof DOMException && statsError.name === "AbortError")) {
                    console.warn("Failed to inspect generated asset", statsError)
                }
            })

        return () => {
            abortController.abort()
        }
    }, [generatedAssets, neuralRun?.viewerUrl, neuralRun?.viewerSource, neuralRun?.assetStats])

    const handleContinueToSuggestedTool = (toolId: string) => {
        if (!neuralRun?.viewerUrl) return

        const targetTool = getToolById(toolId)
        if (!targetTool) return

        const sourceImageInputKey = getImageInputKey(neuralRun.tool)
        const carriedReference = (sourceImageInputKey ? neuralRun.inputs[sourceImageInputKey] : undefined) ?? neuralRun.inputs.referenceImage
        const draft = buildToolLaunchInputs(targetTool, neuralRun.viewerUrl, carriedReference)

        setToolDrafts((prev) => ({
            ...prev,
            [targetTool.id]: draft,
        }))
        setSavedNeuralRuns((prev) =>
            neuralRun ? { ...prev, [neuralRun.stepId]: neuralRun } : prev
        )
        setNeuralRun(null)
        onRequestCategoryChange?.(targetTool.category)
        setSelectedTool(targetTool)
    }

    if (!category) return null

    // ── Detail view ──
    if (neuralRun) {
        const referenceImageKey = getImageInputKey(neuralRun.tool)
        const referenceImage = referenceImageKey ? neuralRun.inputs[referenceImageKey] : undefined

        return (
            <div className="relative flex min-h-0 flex-1 overflow-hidden">
                {neuralRun.dockMode === "collapsed" ? (
                    <button
                        type="button"
                        onClick={handleRestoreNeuralPanel}
                        className="absolute left-4 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border shadow-lg transition hover:opacity-90"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "rgba(255,255,255,0.96)",
                            color: "hsl(var(--forge-text-muted))",
                        }}
                        aria-label="Restore neural panel"
                        title="Restore tool panel"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </button>
                ) : (
                    <NeuralRunOverlay
                        run={neuralRun}
                        referenceImage={referenceImage}
                        viewerSamples={viewerSamples}
                        draftInputs={neuralRun.draftInputs}
                        generatedAssets={generatedAssets}
                        onLoadDemo={handleLoadDemoSample}
                        onDraftInputChange={handleDraftInputChange}
                        onRequestMeshSelection={(inputKey, currentInputs) =>
                            requestNeuralMeshSelection(neuralRun.tool.id, inputKey, currentInputs)
                        }
                        onContinueToSuggestedTool={handleContinueToSuggestedTool}
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
                        assetStats={neuralRun.assetStats}
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
                inputs={toolDrafts[selectedTool.id] ?? {}}
                onInputChange={(key, value) =>
                    setToolDrafts((prev) => ({
                        ...prev,
                        [selectedTool.id]: {
                            ...(prev[selectedTool.id] ?? {}),
                            [key]: value,
                        },
                    }))
                }
                generatedAssets={generatedAssets}
                onRequestMeshSelection={(inputKey, currentInputs) =>
                    requestToolMeshSelection(selectedTool.id, inputKey, currentInputs)
                }
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
