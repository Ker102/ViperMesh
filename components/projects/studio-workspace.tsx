"use client"

import { useState } from "react"
import {
    CATEGORIES,
    getToolsForCategory,
    type CategoryMeta,
    type StudioCategory,
    type ToolEntry,
    type ToolInput,
} from "@/lib/orchestration/tool-catalog"

interface StudioWorkspaceProps {
    activeCategory: string
    onToolSelect: (tool: ToolEntry, inputs: Record<string, string>) => void
    onToolRunNow: (tool: ToolEntry, inputs: Record<string, string>) => void
}

function PreviewImage(props: React.ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
    const { alt, ...imgProps } = props

    // Uploaded reference previews use in-memory data URLs, so Next image optimization does not apply.
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...imgProps} />
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
}: {
    tool: ToolEntry
    onBack: () => void
    onSubmit: (tool: ToolEntry, inputs: Record<string, string>) => void
    onRunNow: (tool: ToolEntry, inputs: Record<string, string>) => void
}) {
    const [inputs, setInputs] = useState<Record<string, string>>({})

    const handleSubmit = () => {
        onSubmit(tool, inputs)
        setInputs({})
    }

    const handleRunNow = () => {
        onRunNow(tool, inputs)
        setInputs({})
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
                                        onChange={(e) =>
                                            setInputs({ ...inputs, [input.key]: e.target.value })
                                        }
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
                                        onChange={(e) =>
                                            setInputs({ ...inputs, [input.key]: e.target.value })
                                        }
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
                                                    onClick={() => setInputs({ ...inputs, [input.key]: "" })}
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
                                                            setInputs({ ...inputs, [input.key]: reader.result as string })
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
                                            onChange={(e) =>
                                                setInputs({ ...inputs, [input.key]: e.target.value })
                                            }
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

                        <div className="flex gap-3 mt-4">
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
                )}
            </div>
        </div>
    )
}

// ── Main Workspace ──────────────────────────────────────────────

export function StudioWorkspace({
    activeCategory,
    onToolSelect,
    onToolRunNow,
}: StudioWorkspaceProps) {
    const [selectedTool, setSelectedTool] = useState<ToolEntry | null>(null)
    const category = CATEGORIES.find(
        (c: CategoryMeta) => c.id === activeCategory
    )
    const tools = getToolsForCategory(activeCategory as StudioCategory)

    // Reset selected tool when category changes
    const [lastCategory, setLastCategory] = useState(activeCategory)
    if (activeCategory !== lastCategory) {
        setSelectedTool(null)
        setLastCategory(activeCategory)
    }

    if (!category) return null

    // ── Detail view ──
    if (selectedTool) {
        return (
            <ToolDetailView
                tool={selectedTool}
                onBack={() => setSelectedTool(null)}
                onSubmit={(tool, inputs) => {
                    onToolSelect(tool, inputs)
                    setSelectedTool(null)
                }}
                onRunNow={(tool, inputs) => {
                    onToolRunNow(tool, inputs)
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
