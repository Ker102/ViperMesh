"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
    ArrowDownUp,
    ArrowUpRight,
    Check,
    Copy,
    Import,
    Info,
    Layers3,
    RefreshCw,
    Save,
    Search,
    Star,
    Tag,
    Trash2,
    X,
} from "lucide-react"
import { AssetPreviewTile, AssetStatsPills } from "./asset-inspection"
import {
    buildProjectAssetLibrary,
    filterProjectAssetLibraryItems,
    type AssetLibraryCategoryId,
    type AssetLibraryItem,
} from "./asset-library"
import type { GeneratedAssetItem } from "./generated-assets"

const ASSET_SHELF_BUTTON_MOTION =
    "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:hover:translate-y-0 disabled:hover:shadow-none motion-reduce:transition-none"
const ASSET_SHELF_ICON_MOTION =
    "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg active:translate-y-0 active:scale-95 motion-reduce:transition-none"
const ASSET_SHELF_DRAWER_MOTION = "transition-transform duration-300 ease-out motion-reduce:transition-none"
const SUPPORTED_MODEL_IMPORT_PATTERN = /\.(glb|gltf|fbx|obj|stl|zip)$/i

function toEditableCategoryId(categoryId?: AssetLibraryCategoryId | null): EditableAssetCategoryId | "auto" {
    return categoryId === "textured" || categoryId === "geometry" || categoryId === "images"
        ? categoryId
        : "auto"
}

interface GeneratedAssetsShelfProps {
    open: boolean
    assets: GeneratedAssetItem[]
    onOpenAsset: (asset: GeneratedAssetItem, options?: { attachToActiveTool?: boolean }) => void
    onContinueToTool: (asset: GeneratedAssetItem, toolId: string) => void
    onUseAsset: (asset: GeneratedAssetItem) => void
    onImportAsset: (file: File) => Promise<void> | void
    onSaveAsset: (asset: GeneratedAssetItem) => Promise<void> | void
    onUpdateAsset: (asset: GeneratedAssetItem, patch: AssetLibraryMetadataPatch) => Promise<void> | void
    onDeleteAsset: (asset: GeneratedAssetItem) => Promise<void> | void
    onTogglePinned: (asset: GeneratedAssetItem) => Promise<void> | void
    onRetryThumbnail: (asset: GeneratedAssetItem) => void
    selectionMode?: {
        label: string
    } | null
    importInFlight?: boolean
}

export interface AssetLibraryMetadataPatch {
    label?: string
    tags?: string[]
    categoryId?: EditableAssetCategoryId | null
}

type EditableAssetCategoryId = "textured" | "geometry" | "images"
type AssetSortMode = "recent" | "name" | "pinned" | "largest" | "smallest"

function isSupportedImportFile(file: File) {
    return SUPPORTED_MODEL_IMPORT_PATTERN.test(file.name)
}

function getAssetSearchText(asset: AssetLibraryItem) {
    return [
        asset.title,
        asset.viewerLabel,
        asset.toolLabel,
        asset.providerLabel,
        asset.stageLabel,
        asset.userTags.join(" "),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
}

function getAssetTimestamp(asset: AssetLibraryItem) {
    const timestamp = asset.updatedAt ?? asset.createdAt
    return timestamp ? Date.parse(timestamp) || 0 : 0
}

function sortAssetItems(items: AssetLibraryItem[], sortMode: AssetSortMode) {
    const next = [...items]
    next.sort((left, right) => {
        if (sortMode === "name") {
            return (left.viewerLabel ?? left.title).localeCompare(right.viewerLabel ?? right.title)
        }
        if (sortMode === "pinned") {
            return Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned)) || getAssetTimestamp(right) - getAssetTimestamp(left)
        }
        if (sortMode === "largest") {
            return (right.assetStats?.fileSizeBytes ?? 0) - (left.assetStats?.fileSizeBytes ?? 0)
        }
        if (sortMode === "smallest") {
            return (left.assetStats?.fileSizeBytes ?? Number.MAX_SAFE_INTEGER) - (right.assetStats?.fileSizeBytes ?? Number.MAX_SAFE_INTEGER)
        }
        return getAssetTimestamp(right) - getAssetTimestamp(left) || Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned))
    })
    return next
}

function formatAssetDate(timestamp?: string) {
    if (!timestamp) return "Not recorded"
    const parsed = new Date(timestamp)
    if (Number.isNaN(parsed.getTime())) return "Not recorded"
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(parsed)
}

function getThumbnailStatus(asset: AssetLibraryItem) {
    if (asset.previewImageUrl) return "Ready"
    if (asset.id.startsWith("saved:") && asset.assetKind === "model") return "Pending"
    return "Not generated"
}

export function GeneratedAssetsShelf({
    open,
    assets,
    onOpenAsset,
    onContinueToTool,
    onUseAsset,
    onImportAsset,
    onSaveAsset,
    onUpdateAsset,
    onDeleteAsset,
    onTogglePinned,
    onRetryThumbnail,
    selectionMode,
    importInFlight = false,
}: GeneratedAssetsShelfProps) {
    const assetLibrary = useMemo(() => buildProjectAssetLibrary(assets), [assets])
    const [activeCategoryId, setActiveCategoryId] = useState<AssetLibraryCategoryId>("all")
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
    const [activeAssetId, setActiveAssetId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortMode, setSortMode] = useState<AssetSortMode>("recent")
    const [isDragActive, setIsDragActive] = useState(false)
    const importInputRef = useRef<HTMLInputElement | null>(null)

    const effectiveCategoryId = assetLibrary.categories.some((category) => category.id === activeCategoryId)
        ? activeCategoryId
        : "all"

    const visibleItems = filterProjectAssetLibraryItems(assetLibrary, effectiveCategoryId)
    const query = searchQuery.trim().toLowerCase()
    const filteredItems = query
        ? visibleItems.filter((asset) => getAssetSearchText(asset).includes(query))
        : visibleItems
    const sortedItems = sortAssetItems(filteredItems, sortMode)

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

    const handleImportFiles = async (files: FileList | File[]) => {
        const file = Array.from(files).find(isSupportedImportFile)
        if (!file) {
            window.alert("Import a supported model file: GLB, GLTF, FBX, OBJ, STL, or ZIP.")
            return
        }
        await onImportAsset(file)
    }

    return (
        <>
        {selectedAsset && open && (
            <AssetDetailsPanel
                asset={selectedAsset}
                selectionMode={selectionMode}
                onClose={() => setSelectedAssetId(null)}
                onOpenAsset={handleOpenAsset}
                onContinueToTool={onContinueToTool}
                onUseAsset={onUseAsset}
                onSaveAsset={onSaveAsset}
                onUpdateAsset={onUpdateAsset}
                onDeleteAsset={async (asset) => {
                    await onDeleteAsset(asset)
                    setSelectedAssetId(null)
                    if (activeAssetId === asset.id) {
                        setActiveAssetId(null)
                    }
                }}
                onRetryThumbnail={onRetryThumbnail}
                useLivePreview={open}
            />
        )}
        <aside
            aria-hidden={!open}
            inert={!open}
            onDragEnter={(event) => {
                if (event.dataTransfer.types.includes("Files")) {
                    event.preventDefault()
                    setIsDragActive(true)
                }
            }}
            onDragOver={(event) => {
                if (event.dataTransfer.types.includes("Files")) {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = "copy"
                    setIsDragActive(true)
                }
            }}
            onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsDragActive(false)
                }
            }}
            onDrop={async (event) => {
                event.preventDefault()
                setIsDragActive(false)
                if (importInFlight) return
                await handleImportFiles(event.dataTransfer.files)
            }}
            className={`absolute inset-y-0 right-0 z-20 flex h-full w-[320px] flex-col border-l shadow-2xl ${ASSET_SHELF_DRAWER_MOTION}`}
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
                <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
                    <label
                        className="flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "hsl(var(--forge-surface-dim))",
                            color: "hsl(var(--forge-text-muted))",
                        }}
                    >
                        <Search className="h-3.5 w-3.5 shrink-0" />
                        <input
                            aria-label="Search assets"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search assets"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                    </label>
                    <label
                        className="flex items-center gap-1.5 rounded-2xl border px-2 py-2 text-xs"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "hsl(var(--forge-surface-dim))",
                            color: "hsl(var(--forge-text-muted))",
                        }}
                        title="Sort asset library"
                    >
                        <ArrowDownUp className="h-3.5 w-3.5 shrink-0" />
                        <select
                            aria-label="Sort assets"
                            value={sortMode}
                            onChange={(event) => setSortMode(event.target.value as AssetSortMode)}
                            className="max-w-[78px] bg-transparent text-xs font-semibold outline-none"
                        >
                            <option value="recent">Recent</option>
                            <option value="pinned">Pinned</option>
                            <option value="name">Name</option>
                            <option value="largest">Largest</option>
                            <option value="smallest">Smallest</option>
                        </select>
                    </label>
                </div>
                <div className="flex flex-wrap gap-2">
                    {assetLibrary.categories.map((category) => {
                        const isActive = category.id === effectiveCategoryId
                        return (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => setActiveCategoryId(category.id)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${ASSET_SHELF_BUTTON_MOTION}`}
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
                            dragActive={isDragActive}
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
                                : query
                                    ? "No assets match this search. Try another name, tag, provider, or category."
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
                        await handleImportFiles([file])
                    }}
                />
            </div>
            {isDragActive && (
                <div
                    className="pointer-events-none absolute inset-3 z-30 flex items-center justify-center rounded-3xl border border-dashed text-center text-sm font-semibold"
                    style={{
                        borderColor: "hsl(var(--forge-accent))",
                        backgroundColor: "rgba(13,148,136,0.12)",
                        color: "hsl(var(--forge-accent))",
                    }}
                >
                    Drop model to import
                </div>
            )}
        </aside>
        </>
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
    onUpdateAsset,
    onDeleteAsset,
    onRetryThumbnail,
    useLivePreview,
}: {
    asset: AssetLibraryItem
    selectionMode?: { label: string } | null
    onClose: () => void
    onOpenAsset: (asset: AssetLibraryItem, options?: { attachToActiveTool?: boolean }) => void
    onContinueToTool: (asset: AssetLibraryItem, toolId: string) => void
    onUseAsset: (asset: AssetLibraryItem) => void
    onSaveAsset: (asset: AssetLibraryItem) => Promise<void> | void
    onUpdateAsset: (asset: AssetLibraryItem, patch: AssetLibraryMetadataPatch) => Promise<void> | void
    onDeleteAsset: (asset: AssetLibraryItem) => Promise<void> | void
    onRetryThumbnail: (asset: AssetLibraryItem) => void
    useLivePreview: boolean
}) {
    const isSavedAsset = asset.id.startsWith("saved:")
    const [label, setLabel] = useState(asset.viewerLabel ?? asset.title)
    const [tagsText, setTagsText] = useState(asset.userTags.join(", "))
    const [categoryId, setCategoryId] = useState<EditableAssetCategoryId | "auto">(toEditableCategoryId(asset.libraryCategoryOverride))
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [copied, setCopied] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)

    useEffect(() => {
        setLabel(asset.viewerLabel ?? asset.title)
        setTagsText(asset.userTags.join(", "))
        setCategoryId(toEditableCategoryId(asset.libraryCategoryOverride))
        setValidationError(null)
    }, [asset])

    const parsedTags = tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8)

    const handleSaveMetadata = async () => {
        if (!isSavedAsset) return
        const nextLabel = label.trim()
        if (!nextLabel) {
            setValidationError("Name is required.")
            return
        }
        if (nextLabel.length > 255) {
            setValidationError("Name must be 255 characters or fewer.")
            return
        }
        const longTag = parsedTags.find((tag) => tag.length > 32)
        if (longTag) {
            setValidationError(`Tags must be 32 characters or fewer. Shorten "${longTag}".`)
            return
        }

        setIsSaving(true)
        setValidationError(null)
        try {
            await onUpdateAsset(asset, {
                label: nextLabel,
                tags: parsedTags,
                categoryId: categoryId === "auto" ? null : categoryId,
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!isSavedAsset) return
        const confirmed = window.confirm(
            "Remove this saved asset from the project library? The R2 object is kept for now, but this library entry will disappear.",
        )
        if (!confirmed) return

        setIsDeleting(true)
        try {
            await onDeleteAsset(asset)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCopyViewerUrl = async () => {
        try {
            await navigator.clipboard.writeText(new URL(asset.viewerUrl, window.location.origin).toString())
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
        } catch {
            window.alert("Could not copy the viewer URL from this browser session.")
        }
    }

    return (
        <div
            className={`absolute bottom-4 right-[336px] top-4 z-20 flex w-[380px] flex-col overflow-hidden rounded-3xl border shadow-2xl backdrop-blur ${ASSET_SHELF_DRAWER_MOTION}`}
            style={{
                borderColor: "rgba(226,232,240,0.72)",
                backgroundColor: "rgba(255,255,255,0.96)",
                boxShadow: "-16px 20px 48px rgba(15,23,42,0.16)",
            }}
        >
            <div className="flex items-start justify-between gap-3 border-b px-4 py-4" style={{ borderColor: "hsl(var(--forge-border))" }}>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                        Asset details
                    </p>
                    <h3 className="mt-1 text-lg font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                        Library metadata
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${ASSET_SHELF_ICON_MOTION}`}
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        color: "hsl(var(--forge-text-muted))",
                    }}
                    aria-label="Close asset details"
                    title="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="flex items-start gap-3">
                    <div
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border"
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

                <AssetStatsPills stats={asset.assetStats} className="mt-4 flex flex-wrap gap-2" />

                <div
                    className="mt-4 grid gap-2 rounded-2xl border px-3 py-3 text-xs"
                    style={{
                        borderColor: "hsl(var(--forge-border))",
                        backgroundColor: "hsl(var(--forge-surface-dim))",
                        color: "hsl(var(--forge-text-muted))",
                    }}
                >
                    <MetadataRow label="Source" value={asset.librarySource === "saved" ? "Saved library asset" : asset.librarySource} />
                    <MetadataRow label="Storage" value={isSavedAsset ? "Private Cloudflare R2 object" : "Session output"} />
                    <MetadataRow label="Thumbnail" value={getThumbnailStatus(asset)} />
                    <MetadataRow label="Created" value={formatAssetDate(asset.createdAt)} />
                    <MetadataRow label="Updated" value={formatAssetDate(asset.updatedAt)} />
                </div>

                {!isSavedAsset && (
                    <div
                        className="mt-4 rounded-2xl border px-3 py-3 text-xs leading-relaxed"
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            backgroundColor: "hsl(var(--forge-surface-dim))",
                            color: "hsl(var(--forge-text-muted))",
                        }}
                    >
                        Save this generated asset before editing persistent library metadata.
                    </div>
                )}

                <div className="mt-4 space-y-3">
                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                            Name
                        </span>
                        <input
                            value={label}
                            onChange={(event) => setLabel(event.target.value)}
                            disabled={!isSavedAsset}
                            className="mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 disabled:opacity-55"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "hsl(var(--forge-surface))",
                                color: "hsl(var(--forge-text))",
                            }}
                        />
                    </label>

                    <label className="block">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                            <Tag className="h-3.5 w-3.5" />
                            Tags
                        </span>
                        <input
                            value={tagsText}
                            onChange={(event) => setTagsText(event.target.value)}
                            disabled={!isSavedAsset}
                            placeholder="foliage, hero, reference"
                            className="mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 disabled:opacity-55"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "hsl(var(--forge-surface))",
                                color: "hsl(var(--forge-text))",
                            }}
                        />
                        <p className="mt-1 text-[11px]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                            Comma-separated, up to 8 tags.
                        </p>
                    </label>

                    {validationError && (
                        <div
                            className="rounded-2xl border px-3 py-2 text-xs font-medium"
                            style={{
                                borderColor: "rgba(239,68,68,0.28)",
                                backgroundColor: "rgba(254,226,226,0.6)",
                                color: "rgb(185,28,28)",
                            }}
                            role="alert"
                        >
                            {validationError}
                        </div>
                    )}

                    <label className="block">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                            <Layers3 className="h-3.5 w-3.5" />
                            Category
                        </span>
                        <select
                            value={categoryId}
                            onChange={(event) => setCategoryId(event.target.value as EditableAssetCategoryId | "auto")}
                            disabled={!isSavedAsset}
                            className="mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 disabled:opacity-55"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "hsl(var(--forge-surface))",
                                color: "hsl(var(--forge-text))",
                            }}
                        >
                            <option value="auto">Auto</option>
                            <option value="textured">Textured</option>
                            <option value="geometry">Geometry</option>
                            <option value="images">Images</option>
                        </select>
                    </label>

                    {asset.userTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {asset.userTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border px-2 py-1 text-[11px] font-semibold"
                                    style={{
                                        borderColor: "hsl(var(--forge-border))",
                                        color: "hsl(var(--forge-text-muted))",
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {!isSavedAsset && (
                        <button
                            type="button"
                            onClick={() => onSaveAsset(asset)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${ASSET_SHELF_BUTTON_MOTION}`}
                            style={{
                                backgroundColor: "hsl(var(--forge-accent))",
                                color: "white",
                            }}
                        >
                            <Save className="h-3.5 w-3.5" />
                            Save to library
                        </button>
                    )}
                    {isSavedAsset && (
                        <button
                            type="button"
                            onClick={handleSaveMetadata}
                            disabled={isSaving || !label.trim()}
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50 ${ASSET_SHELF_BUTTON_MOTION}`}
                            style={{
                                backgroundColor: "hsl(var(--forge-accent))",
                                color: "white",
                            }}
                        >
                            <Save className="h-3.5 w-3.5" />
                            {isSaving ? "Saving..." : "Save changes"}
                        </button>
                    )}
                    {selectionMode && asset.assetKind === "model" && (
                        <button
                            type="button"
                            onClick={() => onUseAsset(asset)}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${ASSET_SHELF_BUTTON_MOTION}`}
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
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${ASSET_SHELF_BUTTON_MOTION}`}
                        style={{
                            borderColor: "hsl(var(--forge-border))",
                            color: "hsl(var(--forge-text-muted))",
                        }}
                    >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Open in viewer
                    </button>
                    {isSavedAsset && (
                        <button
                            type="button"
                            onClick={handleCopyViewerUrl}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${ASSET_SHELF_BUTTON_MOTION}`}
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                color: "hsl(var(--forge-text-muted))",
                            }}
                        >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? "Copied" : "Copy URL"}
                        </button>
                    )}
                    {isSavedAsset && asset.assetKind === "model" && (
                        <button
                            type="button"
                            onClick={() => onRetryThumbnail(asset)}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${ASSET_SHELF_BUTTON_MOTION}`}
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                color: "hsl(var(--forge-text-muted))",
                            }}
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry thumbnail
                        </button>
                    )}
                    {isSavedAsset && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${ASSET_SHELF_BUTTON_MOTION}`}
                            style={{
                                borderColor: "rgba(239,68,68,0.24)",
                                color: "rgb(185,28,28)",
                            }}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            {isDeleting ? "Removing..." : "Unsave"}
                        </button>
                    )}
                    {asset.nextSuggestions.map((suggestion) => (
                        <button
                            key={suggestion.toolId}
                            type="button"
                            onClick={() => onContinueToTool(asset, suggestion.toolId)}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${ASSET_SHELF_BUTTON_MOTION}`}
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
        </div>
    )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="font-medium uppercase tracking-[0.13em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                {label}
            </span>
            <span className="truncate text-right font-semibold" style={{ color: "hsl(var(--forge-text-muted))" }}>
                {value}
            </span>
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
            className="group relative aspect-square overflow-hidden rounded-2xl border transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none"
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
                className={`absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full ${ASSET_SHELF_ICON_MOTION}`}
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
                className={`absolute bottom-2 left-2 inline-flex h-7 w-7 items-center justify-center rounded-full ${ASSET_SHELF_ICON_MOTION}`}
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
                className={`absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full ${ASSET_SHELF_ICON_MOTION}`}
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
    dragActive,
    onClick,
}: {
    disabled: boolean
    dragActive: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-3 text-center disabled:cursor-wait disabled:opacity-70 ${ASSET_SHELF_BUTTON_MOTION}`}
            style={{
                borderColor: dragActive ? "hsl(var(--forge-accent))" : "hsl(var(--forge-border))",
                backgroundColor: dragActive ? "hsl(var(--forge-accent-subtle))" : "hsl(var(--forge-surface-dim))",
                color: dragActive ? "hsl(var(--forge-accent))" : "hsl(var(--forge-text-muted))",
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
                    Click or drop a reusable GLB, GLTF, FBX, OBJ, STL, or packaged ZIP model.
                </p>
            </div>
        </button>
    )
}
