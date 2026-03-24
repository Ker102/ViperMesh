"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface AdvisorMessage {
    role: "user" | "assistant"
    content: string
}

interface StudioAdvisorProps {
    open: boolean
    onClose: () => void
    projectId: string
}

const SUGGESTION_CHIPS = [
    "What tool should I use next?",
    "What is UV unwrapping?",
    "How do I make it look realistic?",
    "Explain retopology",
    "Help me set up lighting",
]

export function StudioAdvisor({ open, onClose, projectId }: StudioAdvisorProps) {
    const [messages, setMessages] = useState<AdvisorMessage[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return

        const userMsg: AdvisorMessage = { role: "user", content: text.trim() }
        setMessages((prev) => [...prev, userMsg])
        setInput("")
        setLoading(true)

        try {
            const res = await fetch("/api/ai/advisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text.trim(),
                    projectId,
                    context: messages.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n"),
                }),
            })

            if (!res.ok) throw new Error("Advisor request failed")
            const data = await res.json()
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.response ?? "I couldn't generate a response." },
            ])
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I couldn't process that. Try again." },
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className={cn(
                "flex flex-col border-l transition-all duration-300 overflow-hidden shrink-0",
                open ? "w-80" : "w-0 border-l-0"
            )}
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface))",
            }}
        >
            {open && (
                <>
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-4 py-3 border-b"
                        style={{ borderColor: "hsl(var(--forge-border))" }}
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: "hsl(var(--forge-accent))" }}
                            />
                            <h3
                                className="text-sm font-semibold"
                                style={{ color: "hsl(var(--forge-text))" }}
                            >
                                ViperMesh Assistant
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-sm hover:opacity-70 transition"
                            style={{ color: "hsl(var(--forge-text-muted))" }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <p
                                    className="text-sm font-medium mb-1"
                                    style={{ color: "hsl(var(--forge-text))" }}
                                >
                                    Need help?
                                </p>
                                <p
                                    className="text-xs mb-4"
                                    style={{ color: "hsl(var(--forge-text-muted))" }}
                                >
                                    Ask about tools, concepts, or get recommendations
                                </p>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                            >
                                <div
                                    className="max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                                    style={
                                        msg.role === "user"
                                            ? {
                                                backgroundColor: "hsl(var(--forge-accent))",
                                                color: "white",
                                                borderBottomRightRadius: "4px",
                                            }
                                            : {
                                                backgroundColor: "hsl(var(--forge-surface-dim))",
                                                color: "hsl(var(--forge-text))",
                                                borderBottomLeftRadius: "4px",
                                            }
                                    }
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div
                                    className="px-4 py-2 rounded-2xl text-sm"
                                    style={{
                                        backgroundColor: "hsl(var(--forge-surface-dim))",
                                        color: "hsl(var(--forge-text-muted))",
                                    }}
                                >
                                    <span className="animate-pulse">Thinking…</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Suggestion chips */}
                    {messages.length === 0 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                            {SUGGESTION_CHIPS.map((chip) => (
                                <button
                                    key={chip}
                                    onClick={() => sendMessage(chip)}
                                    className="px-2.5 py-1 rounded-full text-xs border transition hover:border-[hsl(var(--forge-accent))] hover:text-[hsl(var(--forge-accent))]"
                                    style={{
                                        borderColor: "hsl(var(--forge-border))",
                                        color: "hsl(var(--forge-text-muted))",
                                        backgroundColor: "hsl(var(--forge-surface-dim))",
                                    }}
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div
                        className="p-3 border-t"
                        style={{ borderColor: "hsl(var(--forge-border))" }}
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                                placeholder="Ask anything..."
                                className="flex-1 text-sm px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 transition"
                                style={{
                                    borderColor: "hsl(var(--forge-border))",
                                    backgroundColor: "hsl(var(--forge-surface-dim))",
                                    color: "hsl(var(--forge-text))",
                                }}
                            />
                            <button
                                onClick={() => sendMessage(input)}
                                disabled={loading || !input.trim()}
                                className="px-3 py-2 rounded-xl text-sm font-medium text-white shrink-0 transition disabled:opacity-40"
                                style={{ backgroundColor: "hsl(var(--forge-accent))" }}
                            >
                                Ask
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
