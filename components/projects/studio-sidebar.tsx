"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CATEGORY_ICONS, AssistantIcon, LibraryIcon } from "./studio-icons"
import { CATEGORIES, type CategoryMeta, type StudioCategory } from "@/lib/orchestration/tool-catalog"

interface StudioSidebarProps {
    activeCategory: string
    onCategoryChange: (category: string) => void
    onGeneratedAssetsToggle: () => void
    generatedAssetsOpen: boolean
    generatedAssetCount: number
    onAssistantToggle: () => void
    assistantOpen: boolean
}

export function StudioSidebar({
    activeCategory,
    onCategoryChange,
    onGeneratedAssetsToggle,
    generatedAssetsOpen,
    generatedAssetCount,
    onAssistantToggle,
    assistantOpen,
}: StudioSidebarProps) {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

    return (
        <nav
            className="flex flex-col items-center w-16 border-r py-3 gap-1 shrink-0"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface))",
            }}
        >
            {CATEGORIES.map((cat: CategoryMeta) => {
                const IconComponent = CATEGORY_ICONS[cat.id as StudioCategory]
                if (!IconComponent) return null
                const isActive = activeCategory === cat.id

                return (
                    <div key={cat.id} className="relative">
                        <button
                            onClick={() => onCategoryChange(cat.id)}
                            onMouseEnter={() => setHoveredCategory(cat.id)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                                isActive
                                    ? "text-white"
                                    : "text-[hsl(var(--forge-text-muted))] hover:text-[hsl(var(--forge-text))] hover:bg-[hsl(var(--forge-accent-subtle))]"
                            )}
                            style={
                                isActive
                                    ? { backgroundColor: "hsl(var(--forge-accent))" }
                                    : undefined
                            }
                            title={cat.label}
                        >
                            <IconComponent size={20} />
                        </button>

                        {hoveredCategory === cat.id && (
                            <div
                                className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-50 pointer-events-none"
                                style={{
                                    backgroundColor: "hsl(var(--forge-text))",
                                    color: "hsl(var(--forge-surface))",
                                }}
                            >
                                {cat.label}
                            </div>
                        )}
                    </div>
                )
            })}

            <div className="flex-1" />

            <button
                onClick={onGeneratedAssetsToggle}
                className={cn(
                    "mb-2 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 relative",
                    generatedAssetsOpen
                        ? "text-white"
                        : "text-[hsl(var(--forge-text-muted))] hover:text-[hsl(var(--forge-text))] hover:bg-[hsl(var(--forge-accent-subtle))]"
                )}
                style={
                    generatedAssetsOpen
                        ? { backgroundColor: "hsl(var(--forge-accent))" }
                        : undefined
                }
                title="Generated Assets"
            >
                <LibraryIcon size={20} />
                {generatedAssetCount > 0 && (
                    <span
                        className="absolute -right-1 -top-1 min-w-[18px] rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                            backgroundColor: generatedAssetsOpen ? "white" : "hsl(var(--forge-accent))",
                            color: generatedAssetsOpen ? "hsl(var(--forge-accent))" : "white",
                        }}
                    >
                        {generatedAssetCount > 9 ? "9+" : generatedAssetCount}
                    </span>
                )}
            </button>

            <button
                onClick={onAssistantToggle}
                className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 relative",
                    assistantOpen
                        ? "text-white"
                        : "text-[hsl(var(--forge-text-muted))] hover:text-[hsl(var(--forge-text))] hover:bg-[hsl(var(--forge-accent-subtle))]"
                )}
                style={
                    assistantOpen
                        ? { backgroundColor: "hsl(var(--forge-accent))" }
                        : undefined
                }
                title="AI Assistant"
            >
                <AssistantIcon size={20} />
                {!assistantOpen && (
                    <span
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                        style={{ backgroundColor: "hsl(var(--forge-accent))" }}
                    />
                )}
            </button>
        </nav>
    )
}
