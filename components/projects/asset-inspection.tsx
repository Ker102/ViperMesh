"use client"

import type { AssetInspectionStats } from "./workflow-timeline"
import { isRenderablePreviewImage } from "./generated-assets"

function formatCompactCount(value?: number): string | null {
    if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
        return null
    }

    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

export function formatAssetFileSize(bytes?: number): string | null {
    if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes <= 0) {
        return null
    }

    const units = ["B", "KB", "MB", "GB"]
    let value = bytes
    let index = 0
    while (value >= 1024 && index < units.length - 1) {
        value /= 1024
        index += 1
    }
    return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

function StatPill({
    label,
    value,
}: {
    label: string
    value: string
}) {
    return (
        <span
            className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface-dim))",
                color: "hsl(var(--forge-text-muted))",
            }}
        >
            {label}: {value}
        </span>
    )
}

export function AssetStatsPills({
    stats,
    className,
}: {
    stats?: AssetInspectionStats | null
    className?: string
}) {
    if (!stats) return null

    const values = [
        { label: "Triangles", value: formatCompactCount(stats.triangleCount) },
        { label: "Materials", value: formatCompactCount(stats.materialCount) },
        { label: "Textures", value: formatCompactCount(stats.textureCount) },
        { label: "Size", value: formatAssetFileSize(stats.fileSizeBytes) },
    ].filter((item): item is { label: string; value: string } => Boolean(item.value))

    if (values.length === 0) return null

    return (
        <div className={className ?? "flex flex-wrap gap-2"}>
            {values.map((item) => (
                <StatPill key={item.label} label={item.label} value={item.value} />
            ))}
        </div>
    )
}

function getPreviewInitials(stageLabel?: string, providerLabel?: string) {
    if (stageLabel) {
        return stageLabel.slice(0, 2).toUpperCase()
    }
    if (providerLabel) {
        return providerLabel.slice(0, 2).toUpperCase()
    }
    return "3D"
}

export function AssetPreviewTile({
    imageUrl,
    alt,
    stageLabel,
    providerLabel,
    className,
}: {
    imageUrl?: string | null
    alt: string
    stageLabel?: string
    providerLabel?: string
    className?: string
}) {
    if (isRenderablePreviewImage(imageUrl)) {
        // Uploaded or remote previews are already browser-safe at this point.
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={imageUrl} alt={alt} className={className ?? "h-full w-full object-cover"} />
    }

    return (
        <div
            className={className ?? "flex h-full w-full flex-col justify-between p-3"}
            style={{
                background:
                    "radial-gradient(circle at top, rgba(45,212,191,0.28), rgba(15,23,42,0.94) 65%)",
            }}
        >
            <span
                className="inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80"
                style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
                {stageLabel ?? "Asset"}
            </span>
            <div className="flex flex-1 items-center justify-center">
                <span className="text-2xl font-semibold tracking-[0.12em] text-white/90">
                    {getPreviewInitials(stageLabel, providerLabel)}
                </span>
            </div>
            <span className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-white/65">
                {providerLabel ?? "Project asset"}
            </span>
        </div>
    )
}

function StatsRow({
    label,
    value,
}: {
    label: string
    value?: string | null
}) {
    if (!value) return null

    return (
        <div
            className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-b-0"
            style={{ borderColor: "hsl(var(--forge-border))" }}
        >
            <span style={{ color: "hsl(var(--forge-text-muted))" }}>{label}</span>
            <span className="font-medium text-right" style={{ color: "hsl(var(--forge-text))" }}>
                {value}
            </span>
        </div>
    )
}

export function AssetStatsPanel({
    stats,
}: {
    stats?: AssetInspectionStats | null
}) {
    if (!stats) {
        return (
            <div
                className="rounded-2xl border p-4 text-sm"
                style={{
                    borderColor: "hsl(var(--forge-border))",
                    backgroundColor: "rgba(255,255,255,0.82)",
                    color: "hsl(var(--forge-text-muted))",
                }}
            >
                Metadata will appear here once this asset has been inspected.
            </div>
        )
    }

    return (
        <div
            className="rounded-[24px] border p-4 shadow-xl backdrop-blur"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "rgba(255,255,255,0.88)",
            }}
        >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                Asset stats
            </p>
            <div className="mt-3">
                <StatsRow label="Stage" value={stats.stageLabel} />
                <StatsRow label="Source tool" value={stats.sourceToolLabel} />
                <StatsRow label="Provider" value={stats.sourceProvider} />
                <StatsRow label="Triangles" value={formatCompactCount(stats.triangleCount)} />
                <StatsRow label="Materials" value={formatCompactCount(stats.materialCount)} />
                <StatsRow label="Textures" value={formatCompactCount(stats.textureCount)} />
                <StatsRow label="Meshes" value={formatCompactCount(stats.meshCount)} />
                <StatsRow label="File size" value={formatAssetFileSize(stats.fileSizeBytes)} />
            </div>
        </div>
    )
}
