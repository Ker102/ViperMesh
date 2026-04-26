"use client"

import { useMemo, useRef, useState } from "react"
import { ArrowUpRight, Import, Info, Star } from "lucide-react"
import { getToolById } from "@/lib/orchestration/tool-catalog"
import { AssetPreviewTile, AssetStatsPills } from "./asset-inspection"
import {
    buildProjectAssetLibrary,
    filterProjectAssetLibraryItems,
    type AssetLibraryCategoryId,
    type AssetLibraryItem,
} from "./asset-library"
import type { GeneratedAssetItem } from "./generated-assets"

interface GeneratedAssetsShelfProps {
    open: boolean
    assets: GeneratedAssetItem[]
    onOpenAsset: (asset: GeneratedAssetItem, options?: { attachToActiveTool?: boolean }) => void
    onContinueToTool: (asset: GeneratedAssetItem, toolId: string) => void
    onUseAsset: (asset: GeneratedAssetItem) => void
    onImportAsset: (file: File) => Promise<void> | void
    onSaveAsset: (asset: GeneratedAssetItem) => Promise<void> | void
    onTogglePinned: (asset: GeneratedAssetItem) => Promise<void> | void
    selectionMode?: {
        label: string
    } | null
    importInFlight?: boolean
}

export function GeneratedAssetsShelf({
    open,
    assets,
    onOpenAsset,
    onContinueToTool,
    onUseAsset,
    onImportAsset,
    onSaveAsset,
    onTogglePinned,
    selectionMode,
    importInFlight = false,
}: GeneratedAssetsShelfProps) {
    const assetLibrary = useMemo(() => buildProjectAssetLibrary(assets), [assets])
    const [activeCategoryId, setActiveCategoryId] = useState<AssetLibraryCategoryId>("all")
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
    const importInputRef = useRef<HTMLInputElement | null>(null)

    if (!open) {
        return null
    }

    const effectiveCategoryId = assetLibrary.categories.some((category) => category.id === activeCategoryId)
        ? activeCategoryId
        : "all"

    const visibleItems = filterProjectAssetLibraryItems(assetLibrary, effectiveCategoryId)
    const sortedItems = [...visibleItems].sort((left, right) => {
        const leftFavorite = left.isPinned ? 1 : 0
        const rightFavorite = right.isPinned ? 1 : 0
        return rightFavorite - leftFavorite
    })

    const selectedAsset =
        sortedItems.find((asset) => asset.id === selectedAssetId) ??
        sortedItems[0] ??
        null

    const toggleFavorite = (asset: GeneratedAssetItem) => {
        void onTogglePinned(asset)
    }

    return (
        <aside
            className="flex h-full w-[320px] shrink-0 flex-col border-l transition-all duration-300"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface))",
            }}
        >
            <div
                className="border-b px-4 py-4"
                style={{ borderColor: "hsl(var(--forge-border))" }}
            >
                <p
                    className="text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "hsl(var(--forge-text-subtle))" }}
                >
                    Asset Library
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                        Project assets
                    </h3>
                    <span
                        className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            color: "hsl(var(--forge-text-muted))",
                        }}
                    >
                        {assetLibrary.items.length}
                    </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
                    Generated outputs and imported model packages live here first. This drawer is the fast reusable asset source for the current project.
                </p>
                {selectionMode && (
                    <div
                        className="mt-3 rounded-2xl border px-3 py-2 text-xs font-medium"
                        style={{
                            borderColor: "hsl(var(--forge-accent))",
                            backgroundColor: "hsl(var(--forge-accent-subtle))",
                            color: "hsl(var(--forge-accent))",
                        }}
                    >
                        Selecting a model for {selectionMode.label}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
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
                                {category.label} ({category.count})
                            </button>
                        )
                    })}
                </div>

                <div className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                        <ImportAssetTile
                            disabled={importInFlight}
                            onClick={() => importInputRef.current?.click()}
                        />
                        {sortedItems.map((asset) => (
                            <AssetLibraryGridCard
                                key={asset.id}
                                asset={asset}
                                isFavorite={Boolean(asset.isPinned)}
                                isSelected={selectedAsset?.id === asset.id}
                                onOpenAsset={onOpenAsset}
                                attachToSelectionMode={Boolean(selectionMode)}
                                onSelectInfo={setSelectedAssetId}
                                onToggleFavorite={toggleFavorite}
                            />
                        ))}
                    </div>
                    {sortedItems.length === 0 && (
                        <div
                            className="mt-3 rounded-2xl border px-4 py-5 text-sm"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "hsl(var(--forge-surface-dim))",
                                color: "hsl(var(--forge-text-muted))",
                            }}
                        >
                            {assets.length === 0
                                ? "No project assets yet. Import a GLB, GLTF, FBX, OBJ, STL, or ZIP package and the result will appear here automatically."
                                : "No assets match this category yet. Switch categories to inspect the rest of the library."}
                        </div>
                    )}
                </div>

                <input
                    ref={importInputRef}
                    type="file"
                    accept=".glb,.gltf,.fbx,.obj,.stl,.zip,model/gltf-binary,model/gltf+json,model/vnd.autodesk.fbx,model/obj,model/stl,application/zip,application/x-zip-compressed"
                    className="hidden"
                    onClick={(event) => {
                        ;(event.target as HTMLInputElement).value = ""
                    }}
                    onChange={async (event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        await onImportAsset(file)
                    }}
                />

                {selectedAsset && (
                    <div
                        className="mt-4 rounded-2xl border p-4"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "hsl(var(--forge-surface-dim))",
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border"
                                style={{ borderColor: "hsl(var(--forge-border))" }}
                            >
                                <AssetPreviewTile
                                    imageUrl={selectedAsset.previewImageUrl}
                                    alt={selectedAsset.viewerLabel ?? selectedAsset.title}
                                    stageLabel={selectedAsset.stageLabel}
                                    providerLabel={selectedAsset.providerLabel}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                                    {selectedAsset.viewerLabel ?? selectedAsset.title}
                                </p>
                                <p className="mt-1 text-xs" style={{ color: "hsl(var(--forge-text-muted))" }}>
                                    From {selectedAsset.toolLabel}
                                    {selectedAsset.stageLabel ? ` • ${selectedAsset.stageLabel}` : ""}
                                    {selectedAsset.providerLabel ? ` • ${selectedAsset.providerLabel}` : ""}
                                </p>
                                <p
                                    className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em]"
                                    style={{ color: "hsl(var(--forge-text-subtle))" }}
                                >
                                    {selectedAsset.assetKind === "image"
                                        ? "Image asset"
                                        : selectedAsset.densityBucket === "high-poly"
                                            ? "High poly model"
                                            : selectedAsset.densityBucket === "low-poly"
                                                ? "Low poly model"
                                                : "Model asset"}
                                </p>
                            </div>
                        </div>

                        <AssetStatsPills stats={selectedAsset.assetStats} className="mt-3 flex flex-wrap gap-2" />

                        <div className="mt-4 flex flex-wrap gap-2">
                            {!selectedAsset.id.startsWith("saved:") && (
                                <button
                                    type="button"
                                    onClick={() => onSaveAsset(selectedAsset)}
                                    className="rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                                    style={{
                                        backgroundColor: "hsl(var(--forge-accent))",
                                        color: "white",
                                    }}
                                >
                                    Save to library
                                </button>
                            )}
                            {selectionMode && selectedAsset.assetKind === "model" && (
                                <button
                                    type="button"
                                    onClick={() => onUseAsset(selectedAsset)}
                                    className="rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                                    style={{
                                        backgroundColor: "hsl(var(--forge-accent))",
                                        color: "white",
                                    }}
                                >
                                    Use in {selectionMode.label}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onOpenAsset(selectedAsset, {
                                    attachToActiveTool: Boolean(selectionMode && selectedAsset.assetKind === "model"),
                                })}
                                className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                                style={{
                                    borderColor: "hsl(var(--forge-border))",
                                    color: "hsl(var(--forge-text-muted))",
                                }}
                            >
                                Open in viewer
                            </button>
                            {selectedAsset.nextSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion.toolId}
                                    type="button"
                                    onClick={() => onContinueToTool(selectedAsset, suggestion.toolId)}
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
                )}
            </div>
        </aside>
    )
}

function AssetLibraryGridCard({
    asset,
    isFavorite,
    isSelected,
    onOpenAsset,
    attachToSelectionMode,
    onSelectInfo,
    onToggleFavorite,
}: {
    asset: AssetLibraryItem
    isFavorite: boolean
    isSelected: boolean
    onOpenAsset: (asset: AssetLibraryItem, options?: { attachToActiveTool?: boolean }) => void
    attachToSelectionMode: boolean
    onSelectInfo: (assetId: string) => void
    onToggleFavorite: (asset: AssetLibraryItem) => void
}) {
    const tool = getToolById(asset.toolName)

    return (
        <div
            className="relative overflow-hidden rounded-2xl border transition-all duration-200"
            style={{
                borderColor: isSelected ? "hsl(var(--forge-accent))" : "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface-dim))",
                boxShadow: isSelected ? "0 0 0 1px hsl(var(--forge-accent-subtle)) inset" : undefined,
            }}
        >
            <button
                type="button"
                onClick={() => onOpenAsset(asset, { attachToActiveTool: attachToSelectionMode && asset.assetKind === "model" })}
                className="group block w-full text-left"
                title="Open in viewer"
            >
                <div className="relative aspect-square w-full overflow-hidden">
                    <AssetPreviewTile
                        imageUrl={asset.previewImageUrl}
                        alt={asset.viewerLabel ?? asset.title}
                        stageLabel={asset.stageLabel}
                        providerLabel={asset.providerLabel}
                        className="h-full w-full object-cover"
                    />

                    <span
                        className="absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                        style={{
                            backgroundColor: "rgba(15,23,42,0.78)",
                            color: "white",
                        }}
                    >
                        {asset.stageLabel ?? tool?.category ?? "Asset"}
                    </span>

                    <span
                        className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full border"
                        style={{
                            borderColor: "rgba(255,255,255,0.22)",
                            backgroundColor: "rgba(15,23,42,0.72)",
                            color: "rgba(255,255,255,0.9)",
                        }}
                        aria-hidden="true"
                    >
                        <ArrowUpRight className="h-4 w-4" />
                    </span>
                </div>

                <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                        {asset.viewerLabel ?? asset.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
                        {asset.stageLabel ?? tool?.category ?? "Asset"}
                        {asset.providerLabel ? ` • ${asset.providerLabel}` : ""}
                    </p>
                </div>
            </button>

            <button
                type="button"
                onClick={() => onToggleFavorite(asset)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border transition hover:opacity-90"
                style={{
                    borderColor: "rgba(255,255,255,0.22)",
                    backgroundColor: "rgba(15,23,42,0.72)",
                    color: isFavorite ? "#facc15" : "rgba(255,255,255,0.9)",
                }}
                aria-label={isFavorite ? "Unpin asset" : "Pin asset"}
                title={isFavorite ? "Pinned" : "Pin to library"}
            >
                <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </button>

            <button
                type="button"
                onClick={() => onSelectInfo(asset.id)}
                className="absolute bottom-16 left-2 inline-flex h-8 w-8 items-center justify-center rounded-full border transition hover:opacity-90"
                style={{
                    borderColor: "rgba(255,255,255,0.22)",
                    backgroundColor: "rgba(15,23,42,0.72)",
                    color: "rgba(255,255,255,0.9)",
                }}
                aria-label="View asset details"
                title="View asset details"
            >
                <Info className="h-4 w-4" />
            </button>
        </div>
    )
}

function ImportAssetTile({
    disabled,
    onClick,
}: {
    disabled: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-3 text-center transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface-dim))",
                color: "hsl(var(--forge-text-muted))",
            }}
            title="Import a GLB, GLTF, FBX, OBJ, STL, or packaged ZIP model into this project asset library"
        >
            <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                    backgroundColor: "hsl(var(--forge-accent-subtle))",
                    color: "hsl(var(--forge-accent))",
                }}
            >
                <Import className="h-5 w-5" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                    {disabled ? "Importing…" : "Import Model"}
                </p>
                <p className="text-[11px] leading-relaxed">
                    Add a reusable GLB, GLTF, FBX, OBJ, STL, or packaged ZIP model.
                </p>
            </div>
        </button>
    )
}
