"use client"

import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const defaults = (size = 24): SVGProps<SVGSVGElement> => ({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
})

// ── Category Icons ──────────────────────────────────────────────

export function ShapeIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path d="M12 12l8-4.5" />
            <path d="M12 12v9" />
            <path d="M12 12L4 7.5" />
        </svg>
    )
}

export function CleanupIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    )
}

export function UnwrapIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    )
}

export function PaintIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M12 2a10 10 0 1 0 0 14" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
        </svg>
    )
}

export function SkeletonIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <circle cx="12" cy="4.5" r="2.5" />
            <path d="M12 7v5" />
            <path d="M8 10l4 2 4-2" />
            <path d="M12 12l-4 5" />
            <path d="M12 12l4 5" />
            <path d="M8 17l-1 4" />
            <path d="M16 17l1 4" />
        </svg>
    )
}

export function MotionIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
    )
}

export function EffectsIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
            <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z" />
            <path d="M5 17l.6 1.4L7 19l-1.4.6L5 21l-.6-1.4L3 19l1.4-.6L5 17z" />
        </svg>
    )
}

export function LightingIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
    )
}

export function SceneIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M12 2v4" />
            <path d="M2 12h20" />
        </svg>
    )
}

export function RenderIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    )
}

export function ExportIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    )
}

// ── UI Icons ────────────────────────────────────────────────────

export function AssistantIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    )
}

export function LibraryIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14H6.5A2.5 2.5 0 0 0 4 20.5v-14Z" />
            <path d="M4 18a2 2 0 0 1 2-2h14" />
            <path d="M8 8h7" />
            <path d="M8 12h5" />
        </svg>
    )
}

export function SettingsIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    )
}

// ── Suggestion Card Icons (replace emojis) ──────────────────────

export function CastleIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M2 20h20" />
            <path d="M5 20V8l2-2V4h2v2l2-2V2h2v2l2 2V4h2v2l2 2v12" />
            <path d="M10 20v-4h4v4" />
        </svg>
    )
}

export function FoxIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M8 2l4 6 4-6" />
            <path d="M4 10c0-2 1-4 4-5l4 6 4-6c3 1 4 3 4 5 0 6-4 11-8 11s-8-5-8-11z" />
            <circle cx="9.5" cy="11.5" r="1" fill="currentColor" />
            <circle cx="14.5" cy="11.5" r="1" fill="currentColor" />
            <path d="M10 15l2 1 2-1" />
        </svg>
    )
}

export function RocketIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    )
}

export function TreeIcon({ size, ...props }: IconProps) {
    return (
        <svg {...defaults(size)} {...props}>
            <path d="M12 3l-7 10h4l-3 8h12l-3-8h4L12 3z" />
        </svg>
    )
}

// ── Category icon mapping ───────────────────────────────────────

import type { StudioCategory } from "@/lib/orchestration/tool-catalog"

export type { IconProps }

export const CATEGORY_ICONS: Record<StudioCategory, React.ComponentType<IconProps>> = {
    shape: ShapeIcon,
    cleanup: CleanupIcon,
    unwrap: UnwrapIcon,
    paint: PaintIcon,
    skeleton: SkeletonIcon,
    motion: MotionIcon,
    effects: EffectsIcon,
    lighting: LightingIcon,
    scene: SceneIcon,
    rendering: RenderIcon,
    export: ExportIcon,
}
