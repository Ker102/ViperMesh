/**
 * RAG (Retrieval-Augmented Generation) Module
 * 
 * Provides context-aware generation by combining:
 * - Deterministic tool-guide injection (from disk)
 * - Vector store retrieval for script examples (Neon pgvector)
 * - Gemini 3.1 Pro generation
 */

import * as fs from "fs"
import * as path from "path"
import { createGeminiModel } from "./index"
import { similaritySearch, type SearchResult } from "./vectorstore"
import { correctiveRetrieve } from "./crag"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

export interface RAGOptions {
    /** Number of documents to retrieve */
    topK?: number
    /** Minimum similarity threshold (0-1) */
    minSimilarity?: number
    /** Filter by document source */
    source?: string
    /** Additional context to include */
    additionalContext?: string
    /** Temperature for generation */
    temperature?: number
}

export interface RAGResult {
    response: string
    sources: SearchResult[]
    tokensUsed?: number
}

/**
 * Generate a response using RAG
 */
export async function generateWithRAG(
    query: string,
    options: RAGOptions = {}
): Promise<RAGResult> {
    const topK = options.topK ?? 5
    const minSimilarity = options.minSimilarity ?? 0.5

    // Step 1: Retrieve relevant documents
    const sources = await similaritySearch(query, {
        limit: topK,
        source: options.source,
        minSimilarity,
    })

    // Step 2: Build context from retrieved documents
    const contextParts: string[] = []

    if (sources.length > 0) {
        contextParts.push("## Relevant Context\n")
        for (const doc of sources) {
            contextParts.push(`### Source: ${doc.source ?? "unknown"} (similarity: ${doc.similarity.toFixed(3)})`)
            contextParts.push(doc.content)
            contextParts.push("")
        }
    }

    if (options.additionalContext) {
        contextParts.push("## Additional Context\n")
        contextParts.push(options.additionalContext)
    }

    const context = contextParts.join("\n")

    // Step 3: Generate response with context
    const model = createGeminiModel({
        temperature: options.temperature ?? 0.4,
    })

    const systemPrompt = `You are ModelForge, an AI assistant that helps users create and modify Blender scenes.
You have access to relevant documentation and context to help answer questions accurately.

Use the provided context to inform your responses. If the context doesn't contain relevant information, say so.

${context}`

    const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(query),
    ]

    const response = await model.invoke(messages)

    return {
        response: response.content as string,
        sources,
    }
}

/**
 * Generate Blender Python code using RAG
 */
export async function generateBlenderCode(
    request: string,
    options: RAGOptions = {}
): Promise<RAGResult> {
    // Use CRAG pipeline for better relevance filtering
    const cragResult = await correctiveRetrieve(request, {
        topK: options.topK ?? 8,
        source: options.source ?? "blender-scripts",
        minSimilarity: options.minSimilarity ?? 0.4,
        minRelevantDocs: 2,
    })

    const sources = cragResult.documents
    console.log(
        `[CRAG] Retrieved ${cragResult.totalRetrieved}, ` +
        `relevant: ${cragResult.totalRelevant}, ` +
        `fallback: ${cragResult.usedFallback}`
    )

    // Build context from Blender docs
    const contextParts: string[] = []

    if (sources.length > 0) {
        contextParts.push("## Blender API Reference\n")
        for (const doc of sources) {
            contextParts.push(doc.content)
            contextParts.push("")
        }
    }

    const context = contextParts.join("\n")

    // Generate code with specialized prompt
    const model = createGeminiModel({
        temperature: options.temperature ?? 0.3, // Lower temp for code
        maxOutputTokens: 4096,
    })

    const systemPrompt = `You are a Blender Python expert. Generate clean, efficient Python code for Blender.

Guidelines:
1. Use bpy module for all Blender operations
2. Keep scripts focused and idempotent (safe to run multiple times)
3. Apply materials in the same step that creates geometry
4. Use descriptive object names
5. Include error handling where appropriate
6. Add comments for complex operations

${context ? `## Blender API Reference\n${context}` : ""}

Respond with ONLY the Python code, no explanations.`

    const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(request),
    ]

    const response = await model.invoke(messages)

    return {
        response: response.content as string,
        sources,
    }
}

/**
 * Create a context string from search results for use in prompts
 */
export function formatContextFromSources(sources: SearchResult[]): string {
    if (sources.length === 0) return ""

    const guides = sources.filter((s) => s.source === "tool-guides")
    const scripts = sources.filter((s) => s.source !== "tool-guides")

    const parts: string[] = []

    // Domain guides first — they provide decision-making knowledge
    if (guides.length > 0) {
        parts.push("## Domain Guides\n")
        parts.push("Use the following domain knowledge to make better decisions about parameter values and tool usage:\n")
        for (const guide of guides) {
            const title =
                (guide.metadata as Record<string, unknown> | null)?.title ??
                guide.source ??
                "Guide"
            parts.push(`### ${title}`)
            parts.push(guide.content)
            parts.push("")
        }
    }

    // Code script references second
    if (scripts.length > 0) {
        parts.push("## Script References\n")
        for (const script of scripts) {
            parts.push(`---\nSource: ${script.source ?? "unknown"}`)
            parts.push(script.content)
            parts.push("")
        }
    }

    return parts.join("\n")
}

// ── Selective Tool-Guide Injection ──
// These hand-crafted domain guides provide task-specific knowledge (camera
// positioning, render settings, etc.). We only inject guides that are RELEVANT
// to the user's request — not all 7 (~30KB) every time.

const TOOL_GUIDES_DIR = path.join(process.cwd(), "data", "tool-guides")

interface ToolGuideEntry {
    filename: string
    title: string
    category: string
    tags: string[]
    triggeredBy: string[]
    content: string   // markdown body (frontmatter stripped)
}

/** Cached parsed guide entries (loaded once from disk) */
let guidesIndex: ToolGuideEntry[] | null = null

/**
 * Strip YAML frontmatter (--- ... ---) from a markdown string.
 */
function stripFrontmatter(content: string): string {
    const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
    return match ? content.slice(match[0].length).trim() : content.trim()
}

/**
 * Parse YAML frontmatter values from a markdown string.
 * Simple regex-based parser — no YAML library needed for flat key-value pairs.
 */
function parseFrontmatter(content: string): Record<string, string> {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!match) return {}
    const meta: Record<string, string> = {}
    for (const line of match[1].split(/\r?\n/)) {
        const kv = line.match(/^(\w+):\s*(.+)$/)
        if (kv) {
            meta[kv[1]] = kv[2].trim()
        }
    }
    return meta
}

/**
 * Parse a YAML array value like ["a", "b", "c"] into a string array.
 */
function parseYamlArray(value: string | undefined): string[] {
    if (!value) return []
    const match = value.match(/\[([^\]]*)\]/)
    if (!match) return [value]
    return match[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
}

/**
 * Load and index all tool-guide files from disk (cached).
 */
function ensureGuidesIndex(): ToolGuideEntry[] {
    if (guidesIndex !== null) return guidesIndex

    guidesIndex = []
    try {
        if (!fs.existsSync(TOOL_GUIDES_DIR)) {
            console.warn(`[RAG] Tool-guides directory not found: ${TOOL_GUIDES_DIR}`)
            return guidesIndex
        }

        const files = fs.readdirSync(TOOL_GUIDES_DIR).filter((f) => f.endsWith(".md"))

        for (const file of files) {
            const filePath = path.join(TOOL_GUIDES_DIR, file)
            const raw = fs.readFileSync(filePath, "utf-8")
            const meta = parseFrontmatter(raw)
            const body = stripFrontmatter(raw)

            if (body.length === 0) continue

            guidesIndex.push({
                filename: file,
                title: meta.title?.replace(/^["']|["']$/g, "") ?? file,
                category: meta.category?.replace(/^["']|["']$/g, "") ?? "",
                tags: parseYamlArray(meta.tags),
                triggeredBy: parseYamlArray(meta.triggered_by),
                content: body,
            })
        }

        console.log(`[RAG] Indexed ${guidesIndex.length} tool-guide files from disk`)
    } catch (error) {
        console.error(`[RAG] Failed to index tool guides:`, error)
    }

    return guidesIndex
}

/**
 * Load only the tool-guides that are RELEVANT to the user's message.
 *
 * Matching logic:
 * - Check if any of the guide's `tags`, `triggeredBy`, or `category`
 *   appear as keywords in the user's message (case-insensitive).
 * - Returns a formatted context block with only matched guides.
 *
 * @returns {{ context: string, count: number }} The formatted context and count of matched guides
 */
export function loadRelevantToolGuides(userMessage: string): { context: string; count: number } {
    const guides = ensureGuidesIndex()
    if (guides.length === 0) return { context: "", count: 0 }

    const messageLower = userMessage.toLowerCase()

    // Build a set of keywords to match: tags + triggeredBy + category
    const matched = guides.filter((guide) => {
        const keywords = [
            ...guide.tags,
            ...guide.triggeredBy,
            guide.category,
        ].filter(Boolean)

        return keywords.some((kw) => {
            const kwLower = kw.toLowerCase()
            // Match whole words or snake_case tool names
            // e.g. "camera" matches "set up a camera", "set_camera_properties" matches tool name
            return messageLower.includes(kwLower)
        })
    })

    if (matched.length === 0) {
        console.log(`[RAG] No tool-guides matched for: "${userMessage.slice(0, 60)}..."`)
        return { context: "", count: 0 }
    }

    const parts: string[] = [
        "## Task-Specific Domain Guides\n",
        "IMPORTANT: Use the following domain knowledge to make correct decisions about parameter values, positioning, and tool usage. These guides contain critical rules that MUST be followed.\n",
    ]

    for (const guide of matched) {
        parts.push(guide.content)
        parts.push("") // blank line separator
    }

    const context = parts.join("\n")
    console.log(
        `[RAG] Matched ${matched.length}/${guides.length} tool-guides: ${matched.map((g) => g.filename).join(", ")} (${context.length} chars)`
    )
    return { context, count: matched.length }
}

/**
 * Invalidate the tool-guide cache (call after re-ingesting or editing guides).
 */
export function invalidateToolGuidesCache(): void {
    guidesIndex = null
}

