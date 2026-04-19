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

function buildNextSuggestions(step: WorkflowTimelineStep): GeneratedAssetSuggestion[] {
    const tool = getToolById(step.toolName)
    if (!tool) return []

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
        const suggestions: GeneratedAssetSuggestion[] = []
        if (cleanupTool) {
            suggestions.push({
                toolId: cleanupTool.id,
                label: `Continue to ${cleanupTool.name}`,
                description: "Prepare a cleaner mesh for game-ready or animation-ready topology.",
                variant: "primary" as const,
            })
        }
        if (rigTool) {
            suggestions.push({
                toolId: rigTool.id,
                label: `Continue to ${rigTool.name}`,
                description: "If this is a character or creature, move into auto-rigging next.",
                variant: "secondary" as const,
            })
        }
        return suggestions
    }

    if (tool.category === "cleanup") {
        const rigTool = getToolById("unirig")
        const exportTool = getToolById("blender-agent-export")
        const suggestions: GeneratedAssetSuggestion[] = []
        if (rigTool) {
            suggestions.push({
                toolId: rigTool.id,
                label: `Continue to ${rigTool.name}`,
                description: "Take a cleaned mesh into rigging for animation.",
                variant: "primary" as const,
            })
        }
        if (exportTool) {
            suggestions.push({
                toolId: exportTool.id,
                label: `Continue to ${exportTool.name}`,
                description: "Export the finished asset once the geometry is ready.",
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
                previewImageUrl: step.inputs?.imageUrl ?? step.inputs?.referenceImage,
                assetStats: neuralState.assetStats,
                referenceImage: step.inputs?.imageUrl ?? step.inputs?.referenceImage,
                nextSuggestions: buildNextSuggestions(step),
            }]
        })
        .reverse()
}
