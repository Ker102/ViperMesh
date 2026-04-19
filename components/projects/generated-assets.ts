"use client"

import { getToolById } from "@/lib/orchestration/tool-catalog"
import type { WorkflowTimelineStep, AssetInspectionStats } from "./workflow-timeline"

export interface GeneratedAssetSuggestion {
    toolId: string
    label: string
    description: string
    variant?: "primary" | "secondary"
}

export interface GeneratedAssetItem {
    id: string
    stepId: string
    title: string
    toolName: string
    toolLabel: string
    viewerUrl: string
    viewerLabel?: string
    providerLabel?: string
    stageLabel?: string
    previewImageUrl?: string
    assetStats?: AssetInspectionStats | null
    referenceImage?: string
    nextSuggestions: GeneratedAssetSuggestion[]
}

type AssetKind = "character" | "environment" | "object" | "unknown"

const CHARACTER_HINT_PATTERN = /\b(character|creature|person|human|humanoid|hero|npc|robot|samurai|warrior|animal|monster|dragon|avatar)\b/i
const ENVIRONMENT_HINT_PATTERN = /\b(scene|environment|interior|exterior|room|building|architecture|landscape|terrain|forest|city|castle|house|street|dungeon)\b/i

function formatStageLabel(category: string): string {
    switch (category) {
        case "shape":
            return "Geometry"
        case "cleanup":
            return "Cleanup"
        case "paint":
            return "Texturing"
        case "skeleton":
            return "Rigging"
        case "export":
            return "Export"
        default:
            return category.charAt(0).toUpperCase() + category.slice(1)
    }
}

function formatProviderLabel(rawProvider?: string): string | undefined {
    if (!rawProvider) return undefined

    const normalized = rawProvider.replace(/-/g, " ")
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function isRenderablePreviewImage(candidate?: string | null): candidate is string {
    if (!candidate) return false
    if (candidate === "[image attached]") return false
    return (
        candidate.startsWith("data:image/") ||
        candidate.startsWith("blob:") ||
        candidate.startsWith("/") ||
        /^https?:\/\//i.test(candidate)
    )
}

function inferAssetKind(toolName: string, inputs?: Record<string, string>): AssetKind {
    const tool = getToolById(toolName)
    if (tool?.category === "skeleton") {
        return "character"
    }

    const promptSeed = [inputs?.prompt, inputs?.description, inputs?.subject]
        .filter(Boolean)
        .join(" ")

    if (!promptSeed) {
        return "unknown"
    }

    if (CHARACTER_HINT_PATTERN.test(promptSeed)) {
        return "character"
    }

    if (ENVIRONMENT_HINT_PATTERN.test(promptSeed)) {
        return "environment"
    }

    return "object"
}

export function buildNextSuggestionsForAsset(toolName: string, inputs?: Record<string, string>): GeneratedAssetSuggestion[] {
    const tool = getToolById(toolName)
    if (!tool) return []
    const assetKind = inferAssetKind(toolName, inputs)

    if (tool.category === "shape") {
        const paintTool = getToolById("hunyuan-paint")
        const cleanupTool = getToolById("meshanything-v2")
        const suggestions: GeneratedAssetSuggestion[] = []
        if (paintTool) {
            suggestions.push({
                toolId: paintTool.id,
                label: `Continue to ${paintTool.name}`,
                description: "Carry this geometry straight into AI PBR texturing.",
                variant: "primary" as const,
            })
        }
        if (cleanupTool) {
            suggestions.push({
                toolId: cleanupTool.id,
                label: `Continue to ${cleanupTool.name}`,
                description: "Retopologize the mesh into cleaner, lower-poly quads.",
                variant: "secondary" as const,
            })
        }
        return suggestions
    }

    if (tool.category === "paint") {
        const cleanupTool = getToolById("meshanything-v2")
        const rigTool = getToolById("unirig")
        const exportTool = getToolById("blender-agent-export")
        const suggestions: GeneratedAssetSuggestion[] = []
        if (assetKind === "character" && rigTool) {
            suggestions.push({
                toolId: rigTool.id,
                label: `Continue to ${rigTool.name}`,
                description: "This looks character-oriented. Move the textured mesh into auto-rigging next.",
                variant: "primary" as const,
            })
        }
        if (cleanupTool) {
            suggestions.push({
                toolId: cleanupTool.id,
                label: `Continue to ${cleanupTool.name}`,
                description: "Clean or retopologize the textured mesh before export or downstream editing.",
                variant: assetKind === "character" ? "secondary" as const : "primary" as const,
            })
        }
        if (assetKind !== "character" && exportTool) {
            suggestions.push({
                toolId: exportTool.id,
                label: `Continue to ${exportTool.name}`,
                description: "If the textured asset is already presentation-ready, export it directly.",
                variant: "secondary" as const,
            })
        } else if (assetKind === "character" && exportTool) {
            suggestions.push({
                toolId: exportTool.id,
                label: `Continue to ${exportTool.name}`,
                description: "Export the textured mesh directly if rigging is not needed.",
                variant: "secondary" as const,
            })
        }
        return suggestions
    }

    if (tool.category === "cleanup") {
        const rigTool = getToolById("unirig")
        const exportTool = getToolById("blender-agent-export")
        const suggestions: GeneratedAssetSuggestion[] = []
        if (assetKind === "character" && rigTool) {
            suggestions.push({
                toolId: rigTool.id,
                label: `Continue to ${rigTool.name}`,
                description: "The cleaned mesh looks ready for auto-rigging and animation prep.",
                variant: "primary" as const,
            })
        }
        if (exportTool) {
            suggestions.push({
                toolId: exportTool.id,
                label: `Continue to ${exportTool.name}`,
                description: "Export once cleanup is complete and the mesh is ready for the target pipeline.",
                variant: assetKind === "character" ? "secondary" as const : "primary" as const,
            })
        }
        if (assetKind !== "character" && rigTool) {
            suggestions.push({
                toolId: rigTool.id,
                label: `Continue to ${rigTool.name}`,
                description: "If this cleaned asset is actually a character, move it into rigging next.",
                variant: "secondary" as const,
            })
        }
        return suggestions
    }

    return []
}

export function extractGeneratedAssets(steps: WorkflowTimelineStep[]): GeneratedAssetItem[] {
    return steps
        .flatMap((step) => {
            const neuralState = step.neuralState
            if (!neuralState?.viewerUrl || neuralState.viewerSource !== "generated") {
                return []
            }

            const tool = getToolById(step.toolName)
            const referenceImage = isRenderablePreviewImage(step.inputs?.imageUrl ?? step.inputs?.referenceImage)
                ? step.inputs?.imageUrl ?? step.inputs?.referenceImage
                : undefined
            return [{
                id: `${step.id}:${neuralState.viewerUrl}`,
                stepId: step.id,
                title: step.title,
                toolName: step.toolName,
                toolLabel: tool?.name ?? step.title,
                viewerUrl: neuralState.viewerUrl,
                viewerLabel: neuralState.viewerLabel,
                providerLabel: neuralState.assetStats?.sourceProvider ?? formatProviderLabel(tool?.provider),
                stageLabel: neuralState.assetStats?.stageLabel ?? (tool ? formatStageLabel(tool.category) : undefined),
                previewImageUrl: referenceImage,
                assetStats: neuralState.assetStats,
                referenceImage,
                nextSuggestions: buildNextSuggestionsForAsset(step.toolName, step.inputs),
            }]
        })
        .reverse()
}
