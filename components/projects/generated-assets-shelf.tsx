"use client"

import { getToolById } from "@/lib/orchestration/tool-catalog"
import type { GeneratedAssetItem } from "./generated-assets"

interface GeneratedAssetsShelfProps {
    open: boolean
    assets: GeneratedAssetItem[]
    onClose: () => void
    onOpenAsset: (stepId: string) => void
    onContinueToPaint: (asset: GeneratedAssetItem) => void
}

export function GeneratedAssetsShelf({
    open,
    assets,
    onClose,
    onOpenAsset,
    onContinueToPaint,
}: GeneratedAssetsShelfProps) {
    return (
        <aside
            className="flex h-full w-[340px] shrink-0 flex-col border-r transition-all duration-300"
            style={{
                width: open ? 340 : 0,
                opacity: open ? 1 : 0,
                pointerEvents: open ? "auto" : "none",
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface))",
            }}
            aria-hidden={!open}
        >
            <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: "hsl(var(--forge-border))" }}
            >
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                        Generated Assets
                    </p>
                    <h3 className="mt-1 text-lg font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                        Project outputs
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
                    Generated results stay attached to their pipeline tabs. Use this shelf to reopen them or hand geometry into the next tool without hunting for the original step.
                </div>

                <div className="mt-4 space-y-3">
                    {assets.length === 0 ? (
                        <div
                            className="rounded-2xl border px-4 py-5 text-sm"
                            style={{
                                borderColor: "hsl(var(--forge-border))",
                                backgroundColor: "hsl(var(--forge-surface-dim))",
                                color: "hsl(var(--forge-text-muted))",
                            }}
                        >
                            No generated assets yet. Successful neural outputs from this project will appear here automatically.
                        </div>
                    ) : (
                        assets.map((asset) => {
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
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
                                                {asset.viewerLabel ?? asset.title}
                                            </p>
                                            <p className="mt-1 text-xs" style={{ color: "hsl(var(--forge-text-muted))" }}>
                                                From {asset.toolLabel}
                                                {tool ? ` • ${tool.category}` : ""}
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
                                        {asset.canContinueToPaint && (
                                            <button
                                                type="button"
                                                onClick={() => onContinueToPaint(asset)}
                                                className="rounded-xl px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                                                style={{ backgroundColor: "hsl(var(--forge-accent))" }}
                                            >
                                                Continue to Paint
                                            </button>
                                        )}
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
