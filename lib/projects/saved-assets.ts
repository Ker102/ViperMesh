import path from "node:path"

import type { Prisma } from "@prisma/client"

import type { GeneratedAssetItem } from "@/components/projects/generated-assets"
import type { AssetInspectionStats } from "@/components/projects/workflow-timeline"

export type SavedAssetLibrarySource = "generated" | "imported" | "saved"

export interface SavedAssetRecordLike {
    id: string
    projectId?: string | null
    sourceStepId?: string | null
    label: string
    objectKey: string
    viewerUrl?: string | null
    previewObjectKey?: string | null
    previewUrl?: string | null
    fileSizeBytes?: number | null
    assetStats?: Prisma.JsonValue | AssetInspectionStats | null
    librarySource: string
    isPinned: boolean
    createdAt: Date
    updatedAt: Date
}

export interface SavedAssetObjectKeyInput {
    userId: string
    projectId: string
    assetId: string
    extension: string
    packagePath?: string
}

export interface SavedAssetPreviewObjectKeyInput {
    userId: string
    projectId: string
    assetId: string
}

export function normalizeAssetExtension(extension: string): string {
    const normalized = extension.trim().toLowerCase()
    if (!normalized) return ".bin"
    return normalized.startsWith(".") ? normalized : `.${normalized}`
}

function normalizePackagePath(packagePath: string): string {
    return packagePath
        .replace(/\\/g, "/")
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/")
}

export function buildSavedAssetObjectKey({
    userId,
    projectId,
    assetId,
    extension,
    packagePath,
}: SavedAssetObjectKeyInput): string {
    const baseKey = `users/${userId}/projects/${projectId}/assets/${assetId}`
    if (packagePath) {
        return `${baseKey}/package/${normalizePackagePath(packagePath)}`
    }
    return `${baseKey}/original${normalizeAssetExtension(extension)}`
}

export function buildSavedAssetPreviewObjectKey({
    userId,
    projectId,
    assetId,
}: SavedAssetPreviewObjectKeyInput): string {
    return `users/${userId}/projects/${projectId}/assets/${assetId}/preview.png`
}

export function buildSavedAssetViewerUrl(assetId: string): string {
    return `/api/projects/assets/${assetId}/file`
}

export function buildSavedAssetThumbnailUrl(assetId: string): string {
    return `/api/projects/assets/${assetId}/thumbnail`
}

export function buildSavedAssetPackageViewerUrl(assetId: string, packagePath: string): string {
    return `/api/projects/assets/${assetId}/files/${normalizePackagePath(packagePath)}`
}

export function getSavedAssetPackagePrefix(objectKey: string): string | null {
    const marker = "/package/"
    const markerIndex = objectKey.indexOf(marker)
    if (markerIndex === -1) return null
    return objectKey.slice(0, markerIndex + marker.length)
}

export function buildSavedAssetViewerUrlForObjectKey(assetId: string, objectKey: string, filename?: string | null): string {
    const packagePrefix = getSavedAssetPackagePrefix(objectKey)
    if (!packagePrefix) {
        const viewerUrl = buildSavedAssetViewerUrl(assetId)
        return filename ? `${viewerUrl}?${new URLSearchParams({ filename }).toString()}` : viewerUrl
    }

    return `/api/projects/assets/${assetId}/files/${objectKey.slice(packagePrefix.length)}`
}

function normalizeAssetStats(
    stats: SavedAssetRecordLike["assetStats"],
    fileSizeBytes?: number | null,
): AssetInspectionStats | null {
    if (!stats || typeof stats !== "object" || Array.isArray(stats)) {
        return fileSizeBytes ? { fileSizeBytes } : null
    }

    const candidate = stats as Record<string, unknown>
    const normalized: AssetInspectionStats = {
        triangleCount: typeof candidate.triangleCount === "number" ? candidate.triangleCount : undefined,
        materialCount: typeof candidate.materialCount === "number" ? candidate.materialCount : undefined,
        textureCount: typeof candidate.textureCount === "number" ? candidate.textureCount : undefined,
        meshCount: typeof candidate.meshCount === "number" ? candidate.meshCount : undefined,
        fileSizeBytes: typeof candidate.fileSizeBytes === "number" ? candidate.fileSizeBytes : fileSizeBytes ?? undefined,
        sourceToolId: typeof candidate.sourceToolId === "string" ? candidate.sourceToolId : undefined,
        sourceToolLabel: typeof candidate.sourceToolLabel === "string" ? candidate.sourceToolLabel : undefined,
        sourceProvider: typeof candidate.sourceProvider === "string" ? candidate.sourceProvider : undefined,
        stageLabel: typeof candidate.stageLabel === "string" ? candidate.stageLabel : undefined,
        thumbnailVersion: typeof candidate.thumbnailVersion === "string" ? candidate.thumbnailVersion : undefined,
    }

    if (!normalized.fileSizeBytes && fileSizeBytes) {
        normalized.fileSizeBytes = fileSizeBytes
    }

    return normalized
}

function normalizeLibrarySource(_source: string): GeneratedAssetItem["librarySource"] {
    return "saved"
}

export function mapSavedAssetRecordToGeneratedAsset(
    record: SavedAssetRecordLike,
    options?: { viewerUrl?: string },
): GeneratedAssetItem {
    const assetStats = normalizeAssetStats(record.assetStats, record.fileSizeBytes)
    const sourceToolId = assetStats?.sourceToolId ?? "asset-library-import"
    const sourceToolLabel = assetStats?.sourceToolLabel ?? "Saved asset"
    const sourceProvider = assetStats?.sourceProvider ?? "Cloudflare R2"
    const stageLabel = assetStats?.stageLabel ?? "Saved"

    return {
        id: `saved:${record.id}`,
        stepId: record.sourceStepId ?? `saved:${record.id}`,
        title: record.label,
        toolName: sourceToolId,
        toolLabel: sourceToolLabel,
        viewerUrl: options?.viewerUrl ?? record.viewerUrl ?? buildSavedAssetViewerUrl(record.id),
        viewerLabel: record.label,
        providerLabel: sourceProvider,
        stageLabel,
        previewImageUrl: record.previewUrl ?? (
            record.previewObjectKey ? buildSavedAssetThumbnailUrl(record.id) : undefined
        ),
        assetStats: assetStats
            ? {
                ...assetStats,
                sourceProvider,
                sourceToolId,
                sourceToolLabel,
                stageLabel,
            }
            : {
                fileSizeBytes: record.fileSizeBytes ?? undefined,
                sourceProvider,
                sourceToolId,
                sourceToolLabel,
                stageLabel,
            },
        referenceImage: undefined,
        nextSuggestions: [],
        librarySource: normalizeLibrarySource(record.librarySource),
        isPinned: record.isPinned,
    }
}

export function getAssetLabelFromPath(candidatePath: string): string {
    const filename = path.basename(candidatePath)
    return filename || "Saved asset"
}
