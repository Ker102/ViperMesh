"use client"

import { useMemo, useState } from "react"
import { getToolById } from "@/lib/orchestration/tool-catalog"
import { AssetPreviewTile, AssetStatsPills } from "./asset-inspection"
import {
    buildProjectAssetLibrary,
    filterProjectAssetLibraryItems,
    type AssetLibraryCategoryId,
} from "./asset-library"
import type { GeneratedAssetItem } from "./generated-assets"

interface GeneratedAssetsShelfProps {
    open: boolean
    assets: GeneratedAssetItem[]
    onClose: () => void
    onOpenAsset: (stepId: string) => void
    onContinueToTool: (asset: GeneratedAssetItem, toolId: string) => void
}

export function GeneratedAssetsShelf({
    open,
    assets,
    onClose,
    onOpenAsset,
    onContinueToTool,
}: GeneratedAssetsShelfProps) {
    const assetLibrary = useMemo(() => buildProjectAssetLibrary(assets), [assets])
    const [activeCategoryId, setActiveCategoryId] = useState<AssetLibraryCategoryId>("all")

    if (!open) {
        return null
    }

    const effectiveCategoryId = assetLibrary.categories.some((category) => category.id === activeCategoryId)
        ? activeCategoryId
        : "all"

    const visibleItems = filterProjectAssetLibraryItems(assetLibrary, effectiveCategoryId)

    return (
        <aside
            className="flex h-full w-[360px] shrink-0 flex-col border-l transition-all duration-300"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface))",
            }}
        >
            <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: "hsl(var(--forge-border))" }}
            >
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                        Asset Library
                    </p>
                    <h3 className="mt-1 text-lg font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                        Project assets
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        color: "hsl(var(--forge-text-muted))",
                    }}
                >
                    Close
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div
                    className="rounded-2xl border p-4 text-sm leading-relaxed"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        backgroundColor: "hsl(var(--forge-surface-dim))",
                        color: "hsl(var(--forge-text-muted))",
                    }}
                >
                    Generated outputs are the first source in the project asset library, including the current scene result when it came from this workflow. This shell is where saved library assets, imported references, and managed catalog items will plug in next without changing the Studio workflow.
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <span
                        className="rounded-full px-3 py-1 text-[11px] font-semibold"
                        style={{
                            backgroundColor: "hsl(var(--forge-accent-subtle))",
                            color: "hsl(var(--forge-accent))",
                        }}
                    >
                        Generated live now
                    </span>
                    <span
                        className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            color: "hsl(var(--forge-text-subtle))",
                        }}
                    >
                        Saved library next
                    </span>
                    <span
                        className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            color: "hsl(var(--forge-text-subtle))",
                        }}
                    >
                        Imports and images later
                    </span>
                </div>

                <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                        Library categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {assetLibrary.categories.map((category) => {
                            const isActive = category.id === effectiveCategoryId
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setActiveCategoryId(category.id)}
                                    className="rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:opacity-90"
                                    style={isActive
                                        ? {
                                            borderColor: "hsl(var(--forge-accent))",
                                            backgroundColor: "hsl(var(--forge-accent-subtle))",
                                            color: "hsl(var(--forge-accent))",
                                        }
                                        : {
                                            borderColor: "hsl(var(--forge-border))",
                                            color: "hsl(var(--forge-text-muted))",
                                        }}
                                    title={category.description}
                                >
                                    {category.label} {category.count > 0 ? `(${category.count})` : ""}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    {visibleItems.length === 0 ? (
                        <div
                            className="rounded-2xl border px-4 py-5 text-sm"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "hsl(var(--forge-surface-dim))",
                                color: "hsl(var(--forge-text-muted))",
                            }}
                        >
                            {assets.length === 0
                                ? "No generated assets yet. Successful neural outputs from this project will appear here automatically."
                                : "No assets match this category yet. Keep generating or switch categories to inspect the rest of the project library."}
                        </div>
                    ) : (
                        visibleItems.map((asset) => {
                            const tool = getToolById(asset.toolName)
                            return (
                                <div
                                    key={asset.id}
                                    className="rounded-2xl border p-4"
                                    style={{
                                        borderColor: "hsl(var(--forge-border))",
                                        backgroundColor: "hsl(var(--forge-surface))",
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
                                            style={{
                                                borderColor: "hsl(var(--forge-border))",
                                                background:
                                                    "radial-gradient(circle at top, rgba(45,212,191,0.18), rgba(15,23,42,0.92) 65%)",
                                            }}
                                        >
                                            <AssetPreviewTile
                                                imageUrl={asset.previewImageUrl}
                                                alt={asset.viewerLabel ?? asset.title}
                                                stageLabel={asset.stageLabel}
                                                providerLabel={asset.providerLabel}
                                                className="h-full w-full"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                                                        {asset.viewerLabel ?? asset.title}
                                                    </p>
                                                    <p className="mt-1 text-xs" style={{ color: "hsl(var(--forge-text-muted))" }}>
                                                        From {asset.toolLabel}
                                                        {asset.stageLabel ? ` • ${asset.stageLabel}` : tool ? ` • ${tool.category}` : ""}
                                                        {asset.providerLabel ? ` • ${asset.providerLabel}` : ""}
                                                    </p>
                                                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                                                        {asset.assetKind === "image"
                                                            ? "Image asset"
                                                            : asset.densityBucket === "high-poly"
                                                                ? "High poly model"
                                                                : asset.densityBucket === "low-poly"
                                                                    ? "Low poly model"
                                                                    : "Model asset"}
                                                    </p>
                                                </div>
                                                <span
                                                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                                    style={{
                                                        backgroundColor: "hsl(var(--forge-accent-subtle))",
                                                        color: "hsl(var(--forge-accent))",
                                                    }}
                                                >
                                                    Ready
                                                </span>
                                            </div>

                                            <AssetStatsPills stats={asset.assetStats} className="mt-3 flex flex-wrap gap-2" />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onOpenAsset(asset.stepId)}
                                            className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                                            style={{
                                                borderColor: "hsl(var(--forge-border))",
                                                color: "hsl(var(--forge-text-muted))",
                                            }}
                                            >
                                                Open in viewer
                                            </button>
                                        {asset.nextSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion.toolId}
                                                type="button"
                                                onClick={() => onContinueToTool(asset, suggestion.toolId)}
                                                className="rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                                                style={suggestion.variant === "primary"
                                                    ? {
                                                        backgroundColor: "hsl(var(--forge-accent))",
                                                        color: "white",
                                                    }
                                                    : {
                                                        borderColor: "hsl(var(--forge-border))",
                                                        borderWidth: "1px",
                                                        color: "hsl(var(--forge-text-muted))",
                                                    }}
                                                title={suggestion.description}
                                            >
                                                {suggestion.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </aside>
    )
}
