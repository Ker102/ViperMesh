"use client"

import { useMemo, useRef, useState } from "react"
import { ArrowUpRight, Import, Info, Star } from "lucide-react"
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
    const [activeAssetId, setActiveAssetId] = useState<string | null>(null)
    const importInputRef = useRef<HTMLInputElement | null>(null)

    const effectiveCategoryId = assetLibrary.categories.some((category) => category.id === activeCategoryId)
        ? activeCategoryId
        : "all"

    const visibleItems = filterProjectAssetLibraryItems(assetLibrary, effectiveCategoryId)
    const sortedItems = [...visibleItems].sort((left, right) => {
        const leftFavorite = left.isPinned ? 1 : 0
        const rightFavorite = right.isPinned ? 1 : 0
        return rightFavorite - leftFavorite
    })

    const selectedAsset = selectedAssetId
        ? assetLibrary.items.find((asset) => asset.id === selectedAssetId) ?? null
        : null

    const toggleFavorite = (asset: GeneratedAssetItem) => {
        void onTogglePinned(asset)
    }

    const handleOpenAsset = (asset: GeneratedAssetItem, options?: { attachToActiveTool?: boolean }) => {
        setActiveAssetId(asset.id)
        onOpenAsset(asset, options)
    }

    return (
        <aside
            aria-hidden={!open}
            inert={!open}
            className="absolute inset-y-0 right-0 z-20 flex h-full w-[320px] flex-col border-l shadow-2xl transition-transform duration-300"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface))",
                boxShadow: "-24px 0 48px rgba(15,23,42,0.12)",
                pointerEvents: open ? "auto" : "none",
                transform: open ? "translateX(0)" : "translateX(100%)",
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

                {selectedAsset && (
                    <AssetDetailsPanel
                        asset={selectedAsset}
                        selectionMode={selectionMode}
                        onClose={() => setSelectedAssetId(null)}
                        onOpenAsset={handleOpenAsset}
                        onContinueToTool={onContinueToTool}
                        onUseAsset={onUseAsset}
                        onSaveAsset={onSaveAsset}
                        useLivePreview={open}
                    />
                )}

                <div className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                        <ImportAssetTile
                            disabled={importInFlight}
                            onClick={() => importInputRef.current?.click()}
                        />
                        {sortedItems.map((asset, index) => (
                            <AssetLibraryGridCard
                                key={asset.id}
                                asset={asset}
                                isFavorite={Boolean(asset.isPinned)}
                                isSelected={selectedAsset?.id === asset.id || activeAssetId === asset.id}
                                onOpenAsset={handleOpenAsset}
                                attachToSelectionMode={Boolean(selectionMode)}
                                onSelectInfo={setSelectedAssetId}
                                onToggleFavorite={toggleFavorite}
                                useLivePreview={open && index < 6 && !asset.id.startsWith("saved:")}
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
            </div>
        </aside>
    )
}

function AssetDetailsPanel({
    asset,
    selectionMode,
    onClose,
    onOpenAsset,
    onContinueToTool,
    onUseAsset,
    onSaveAsset,
    useLivePreview,
}: {
    asset: AssetLibraryItem
    selectionMode?: { label: string } | null
    onClose: () => void
    onOpenAsset: (asset: AssetLibraryItem, options?: { attachToActiveTool?: boolean }) => void
    onContinueToTool: (asset: AssetLibraryItem, toolId: string) => void
    onUseAsset: (asset: AssetLibraryItem) => void
    onSaveAsset: (asset: AssetLibraryItem) => Promise<void> | void
    useLivePreview: boolean
}) {
    return (
        <div
            className="mt-4 rounded-2xl border p-4"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface-dim))",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border"
                        style={{ borderColor: "hsl(var(--forge-border))" }}
                    >
                        <AssetPreviewTile
                            imageUrl={asset.previewImageUrl}
                            modelUrl={asset.assetKind === "model" ? asset.viewerUrl : undefined}
                            alt={asset.viewerLabel ?? asset.title}
                            stageLabel={asset.stageLabel}
                            providerLabel={asset.providerLabel}
                            className="h-full w-full object-cover"
                            useLivePreview={useLivePreview}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                            {asset.viewerLabel ?? asset.title}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "hsl(var(--forge-text-muted))" }}>
                            From {asset.toolLabel}
                            {asset.stageLabel ? ` • ${asset.stageLabel}` : ""}
                            {asset.providerLabel ? ` • ${asset.providerLabel}` : ""}
                        </p>
                        <p
                            className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em]"
                            style={{ color: "hsl(var(--forge-text-subtle))" }}
                        >
                            {asset.assetKind === "image"
                                ? "Image asset"
                                : asset.densityBucket === "high-poly"
                                    ? "High poly model"
                                    : asset.densityBucket === "low-poly"
                                        ? "Low poly model"
                                        : "Model asset"}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border px-2 py-1 text-[11px] font-semibold transition hover:opacity-90"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        color: "hsl(var(--forge-text-muted))",
                    }}
                >
                    Hide
                </button>
            </div>

            <AssetStatsPills stats={asset.assetStats} className="mt-3 flex flex-wrap gap-2" />

            <div className="mt-4 flex flex-wrap gap-2">
                {!asset.id.startsWith("saved:") && (
                    <button
                        type="button"
                        onClick={() => onSaveAsset(asset)}
                        className="rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                        style={{
                            backgroundColor: "hsl(var(--forge-accent))",
                            color: "white",
                        }}
                    >
                        Save to library
                    </button>
                )}
                {selectionMode && asset.assetKind === "model" && (
                    <button
                        type="button"
                        onClick={() => onUseAsset(asset)}
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
                    onClick={() => onOpenAsset(asset, {
                        attachToActiveTool: Boolean(selectionMode && asset.assetKind === "model"),
                    })}
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
}

function AssetLibraryGridCard({
    asset,
    isFavorite,
    isSelected,
    onOpenAsset,
    attachToSelectionMode,
    onSelectInfo,
    onToggleFavorite,
    useLivePreview,
}: {
    asset: AssetLibraryItem
    isFavorite: boolean
    isSelected: boolean
    onOpenAsset: (asset: AssetLibraryItem, options?: { attachToActiveTool?: boolean }) => void
    attachToSelectionMode: boolean
    onSelectInfo: (assetId: string) => void
    onToggleFavorite: (asset: AssetLibraryItem) => void
    useLivePreview: boolean
}) {
    return (
        <div
            className="group relative aspect-square overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-lg"
            style={{
                borderColor: isSelected ? "hsl(var(--forge-accent))" : "rgba(226,232,240,0.58)",
                backgroundColor: "#10141b",
                boxShadow: isSelected
                    ? "0 0 0 1px hsl(var(--forge-accent)) inset, 0 0 0 3px hsl(var(--forge-accent-subtle)), 0 14px 30px rgba(15,23,42,0.16)"
                    : "0 10px 24px rgba(15,23,42,0.08)",
            }}
        >
            <button
                type="button"
                onClick={() => onOpenAsset(asset, { attachToActiveTool: attachToSelectionMode && asset.assetKind === "model" })}
                className="group block h-full w-full text-left"
                title="Open in viewer"
            >
                <div className="relative h-full w-full overflow-hidden">
                    <AssetPreviewTile
                        imageUrl={asset.previewImageUrl}
                        modelUrl={asset.assetKind === "model" ? asset.viewerUrl : undefined}
                        alt={asset.viewerLabel ?? asset.title}
                        stageLabel={asset.stageLabel}
                        providerLabel={asset.providerLabel}
                        className="h-full w-full object-cover"
                        useLivePreview={useLivePreview}
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/28 via-transparent to-black/8 opacity-80" />
                </div>
            </button>

            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation()
                    onToggleFavorite(asset)
                }}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:scale-105"
                style={{
                    backgroundColor: "rgba(9,12,18,0.68)",
                    color: isFavorite ? "#facc15" : "rgba(255,255,255,0.9)",
                }}
                aria-label={isFavorite ? "Unpin asset" : "Pin asset"}
                title={isFavorite ? "Pinned" : "Pin to library"}
            >
                <Star className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
            </button>

            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation()
                    onSelectInfo(asset.id)
                }}
                className="absolute bottom-2 left-2 inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:scale-105"
                style={{
                    backgroundColor: "rgba(9,12,18,0.68)",
                    color: "rgba(255,255,255,0.9)",
                }}
                aria-label="View asset details"
                title="View asset details"
            >
                <Info className="h-3.5 w-3.5" />
            </button>

            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation()
                    onOpenAsset(asset, { attachToActiveTool: attachToSelectionMode && asset.assetKind === "model" })
                }}
                className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:scale-105"
                style={{
                    backgroundColor: "rgba(9,12,18,0.68)",
                    color: "rgba(255,255,255,0.9)",
                }}
                aria-label="Open asset in viewer"
                title="Open in viewer"
            >
                <ArrowUpRight className="h-3.5 w-3.5" />
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
