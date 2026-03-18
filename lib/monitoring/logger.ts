/**
 * Centralized Monitoring Logger
 * 
 * Structured logging with namespaces, levels, and dual output:
 * 1. Console (colorized, for dev server terminal)
 * 2. File (JSON lines, for post-run analysis)
 * 
 * Usage:
 *   const session = createMonitoringSession("chat-request-123")
 *   session.info("crag", "Retrieved 8 documents", { count: 8 })
 *   session.startTimer("code_generation")
 *   // ... work ...
 *   session.endTimer("code_generation")
 *   session.getSummary() // { totalDurationMs, entries, timers, ... }
 */

import * as fs from "fs"
import * as path from "path"

// ============================================================================
// Types
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error"

export type LogNamespace =
    | "planner"
    | "executor"
    | "crag"
    | "neural"
    | "vision"
    | "rag"
    | "strategy"
    | "mcp"
    | "workflow"
    | "system"

export interface LogEntry {
    timestamp: string
    sessionId: string
    namespace: LogNamespace
    level: LogLevel
    message: string
    data?: Record<string, unknown>
    durationMs?: number
}

export interface TimerEntry {
    label: string
    startTime: number
    endTime?: number
    durationMs?: number
}

export interface SessionSummary {
    sessionId: string
    startedAt: string
    endedAt: string
    totalDurationMs: number
    entries: LogEntry[]
    timers: Record<string, number> // label → durationMs
    counts: {
        debug: number
        info: number
        warn: number
        error: number
    }
    neuralCosts: NeuralCostEntry[]
    ragStats: {
        totalRetrieved: number
        totalRelevant: number
        fallbacksUsed: number
    }
}

export interface NeuralCostEntry {
    provider: string
    model: string
    durationMs: number
    estimatedCostUsd: number
}

// ============================================================================
// Constants
// ============================================================================

const LOG_DIR = path.join(process.cwd(), "logs")
const LOG_FILE = path.join(LOG_DIR, "pipeline.log")

// Cost per second by provider (approximate)
const PROVIDER_COST_RATES: Record<string, number> = {
    "fal-hunyuan-shape": 0.0002,
    "fal-trellis": 0.0004,
    "runpod-paint": 0.00019,
    "runpod-part": 0.00016,
    "yvo3d": 0.001,
}

const LEVEL_COLORS: Record<LogLevel, string> = {
    debug: "\x1b[90m",  // gray
    info: "\x1b[36m",   // cyan
    warn: "\x1b[33m",   // yellow
    error: "\x1b[31m",  // red
}
const RESET = "\x1b[0m"
const BOLD = "\x1b[1m"

const NAMESPACE_LABELS: Record<LogNamespace, string> = {
    planner: "PLAN",
    executor: "EXEC",
    crag: "CRAG",
    neural: "NEUR",
    vision: "VISN",
    rag: "RAG ",
    strategy: "STRT",
    mcp: "MCP ",
    workflow: "WKFL",
    system: "SYS ",
}

// ============================================================================
// Ensure log directory exists
// ============================================================================

function ensureLogDir(): void {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true })
        }
    } catch {
        // Silently fail — file logging is best-effort
    }
}

// ============================================================================
// MonitoringSession
// ============================================================================

export class MonitoringSession {
    readonly sessionId: string
    readonly startedAt: string
    private entries: LogEntry[] = []
    private timers: Map<string, TimerEntry> = new Map()
    private neuralCosts: NeuralCostEntry[] = []
    private ragStats = { totalRetrieved: 0, totalRelevant: 0, fallbacksUsed: 0 }
    private counts = { debug: 0, info: 0, warn: 0, error: 0 }
    private onLogCallback?: (entry: LogEntry) => void

    constructor(sessionId: string, onLog?: (entry: LogEntry) => void) {
        this.sessionId = sessionId
        this.startedAt = new Date().toISOString()
        this.onLogCallback = onLog
        ensureLogDir()
    }

    // --------------------------------------------------------------------------
    // Logging methods
    // --------------------------------------------------------------------------

    debug(namespace: LogNamespace, message: string, data?: Record<string, unknown>): void {
        this.log("debug", namespace, message, data)
    }

    info(namespace: LogNamespace, message: string, data?: Record<string, unknown>): void {
        this.log("info", namespace, message, data)
    }

    warn(namespace: LogNamespace, message: string, data?: Record<string, unknown>): void {
        this.log("warn", namespace, message, data)
    }

    error(namespace: LogNamespace, message: string, data?: Record<string, unknown>): void {
        this.log("error", namespace, message, data)
    }

    private log(level: LogLevel, namespace: LogNamespace, message: string, data?: Record<string, unknown>): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            namespace,
            level,
            message,
            data,
        }

        this.entries.push(entry)
        this.counts[level]++

        // Console output (colorized)
        this.writeConsole(entry)

        // File output (JSON line)
        this.writeFile(entry)

        // Callback for streaming to UI
        if (this.onLogCallback) {
            this.onLogCallback(entry)
        }
    }

    private writeConsole(entry: LogEntry): void {
        const color = LEVEL_COLORS[entry.level]
        const nsLabel = NAMESPACE_LABELS[entry.namespace]
        const time = entry.timestamp.split("T")[1]?.slice(0, 12) ?? ""
        const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : ""
        const durationStr = entry.durationMs ? ` (${entry.durationMs}ms)` : ""

        console.log(
            `${color}[${time}] [${nsLabel}] ${entry.level.toUpperCase().padEnd(5)} ${RESET}${entry.message}${BOLD}${durationStr}${RESET}${dataStr}`
        )
    }

    private writeFile(entry: LogEntry): void {
        try {
            const line = JSON.stringify(entry) + "\n"
            fs.appendFileSync(LOG_FILE, line, "utf-8")
        } catch {
            // Silently fail — file logging is best-effort
        }
    }

    // --------------------------------------------------------------------------
    // Timers
    // --------------------------------------------------------------------------

    startTimer(label: string): void {
        this.timers.set(label, {
            label,
            startTime: Date.now(),
        })
        this.debug("system", `⏱ Timer started: ${label}`)
    }

    endTimer(label: string): number {
        const timer = this.timers.get(label)
        if (!timer) {
            this.warn("system", `Timer "${label}" not found`)
            return 0
        }

        timer.endTime = Date.now()
        timer.durationMs = timer.endTime - timer.startTime

        this.info("system", `⏱ Timer completed: ${label}`, { durationMs: timer.durationMs })
        return timer.durationMs
    }

    getTimerDuration(label: string): number | undefined {
        return this.timers.get(label)?.durationMs
    }

    // --------------------------------------------------------------------------
    // Neural cost tracking
    // --------------------------------------------------------------------------

    trackNeuralCost(provider: string, model: string, durationMs: number): void {
        const rateKey = `${provider}-${model}`.toLowerCase()
        const rate = PROVIDER_COST_RATES[rateKey] ?? 0.0003 // default fallback
        const estimatedCostUsd = (durationMs / 1000) * rate

        const costEntry: NeuralCostEntry = {
            provider,
            model,
            durationMs,
            estimatedCostUsd: Math.round(estimatedCostUsd * 100000) / 100000, // 5 decimal places
        }

        this.neuralCosts.push(costEntry)
        this.info("neural", `💰 Neural cost: $${costEntry.estimatedCostUsd.toFixed(5)}`, {
            provider,
            model,
            durationMs,
        })
    }

    // --------------------------------------------------------------------------
    // RAG stats tracking
    // --------------------------------------------------------------------------

    trackRAGRetrieval(totalRetrieved: number, totalRelevant: number, usedFallback: boolean): void {
        this.ragStats.totalRetrieved += totalRetrieved
        this.ragStats.totalRelevant += totalRelevant
        if (usedFallback) this.ragStats.fallbacksUsed++

        this.info("rag", `📚 RAG retrieval: ${totalRelevant}/${totalRetrieved} relevant${usedFallback ? " (fallback used)" : ""}`, {
            totalRetrieved,
            totalRelevant,
            usedFallback,
        })
    }

    // --------------------------------------------------------------------------
    // Summary
    // --------------------------------------------------------------------------

    getSummary(): SessionSummary {
        const endedAt = new Date().toISOString()
        const totalDurationMs = Date.now() - new Date(this.startedAt).getTime()

        const timers: Record<string, number> = {}
        for (const [label, timer] of this.timers) {
            if (timer.durationMs !== undefined) {
                timers[label] = timer.durationMs
            }
        }

        return {
            sessionId: this.sessionId,
            startedAt: this.startedAt,
            endedAt,
            totalDurationMs,
            entries: this.entries,
            timers,
            counts: { ...this.counts },
            neuralCosts: [...this.neuralCosts],
            ragStats: { ...this.ragStats },
        }
    }

    /** Write full session summary to a separate file for easy retrieval */
    persistSummary(): void {
        try {
            const summary = this.getSummary()
            const summaryFile = path.join(LOG_DIR, `session-${this.sessionId.slice(0, 8)}.json`)
            fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), "utf-8")
            this.info("system", `📄 Session summary saved to ${summaryFile}`)
        } catch {
            // Silent
        }
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createMonitoringSession(
    sessionId: string,
    onLog?: (entry: LogEntry) => void
): MonitoringSession {
    return new MonitoringSession(sessionId, onLog)
}
