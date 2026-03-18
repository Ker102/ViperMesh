/**
 * RAG (Retrieval-Augmented Generation) Module
 * 
 * Provides context-aware generation by combining:
 * - Vector store retrieval (Neon pgvector)
 * - Gemini 3.1 Pro generation
 */

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

    const parts: string[] = ["## Retrieved Context\n"]

    for (const source of sources) {
        parts.push(`---\nSource: ${source.source ?? "unknown"}`)
        parts.push(source.content)
        parts.push("")
    }

    return parts.join("\n")
}
