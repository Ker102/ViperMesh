"use client"

import { getToolById } from "@/lib/orchestration/tool-catalog"
import type { WorkflowTimelineStep } from "./workflow-timeline"

export interface GeneratedAssetItem {
    id: string
    stepId: string
    title: string
    toolName: string
    toolLabel: string
    viewerUrl: string
    viewerLabel?: string
    canContinueToPaint: boolean
    referenceImage?: string
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
                canContinueToPaint: tool?.category === "shape",
                referenceImage: step.inputs?.imageUrl ?? step.inputs?.referenceImage,
            }]
        })
        .reverse()
}
