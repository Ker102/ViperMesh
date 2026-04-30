import { randomUUID } from "node:crypto"
import path from "node:path"
import { readFile } from "node:fs/promises"

import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import {
    extractNeuralOutputRelativePath,
    resolveNeuralOutputPath,
} from "@/lib/neural/output-files"
import { readModelStats } from "@/lib/neural/model-stats"
import { deleteAssetObject, getModelContentType, uploadAssetObject } from "@/lib/projects/asset-storage"
import {
    buildSavedAssetObjectKey,
    buildSavedAssetViewerUrlForObjectKey,
    getAssetLabelFromPath,
    mapSavedAssetRecordToGeneratedAsset,
} from "@/lib/projects/saved-assets"

const saveAssetSchema = z.object({
    projectId: z.string().uuid(),
    sourceStepId: z.string().optional(),
    label: z.string().min(1).max(255).optional(),
    viewerUrl: z.string().min(1),
    assetStats: z.record(z.unknown()).optional(),
    isPinned: z.boolean().optional(),
})

function resolveViewerLocalPath(viewerUrl: string): string | null {
    const relativePath = extractNeuralOutputRelativePath(viewerUrl)
    return resolveNeuralOutputPath(relativePath ?? viewerUrl)
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const parsed = saveAssetSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 })
    }

    const { projectId, sourceStepId, viewerUrl, isPinned } = parsed.data
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id, isDeleted: false },
        select: { id: true },
    })

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const localPath = resolveViewerLocalPath(viewerUrl)
    if (!localPath) {
        return NextResponse.json({ error: "Only existing local neural outputs can be saved to R2 in this branch" }, { status: 400 })
    }

    let uploadedObjectKey: string | null = null
    let savedAssetCreated = false
    try {
        const assetId = randomUUID()
        const extension = path.extname(localPath) || ".glb"
        const objectKey = buildSavedAssetObjectKey({
            userId: session.user.id,
            projectId,
            assetId,
            extension,
        })
        const fileBuffer = await readFile(localPath)
        await uploadAssetObject({
            key: objectKey,
            body: fileBuffer,
            contentType: getModelContentType(localPath),
        })
        uploadedObjectKey = objectKey

        const parsedStats = await readModelStats(localPath)
        const label = parsed.data.label ?? getAssetLabelFromPath(localPath)
        const assetStats = {
            ...parsedStats,
            ...(parsed.data.assetStats ?? {}),
            fileSizeBytes: parsedStats.fileSizeBytes,
        }
        const savedAsset = await prisma.savedAsset.create({
            data: {
                id: assetId,
                userId: session.user.id,
                projectId,
                sourceStepId,
                label,
                objectKey,
                viewerUrl: buildSavedAssetViewerUrlForObjectKey(assetId, objectKey, label),
                fileSizeBytes: parsedStats.fileSizeBytes,
                assetStats: assetStats as Prisma.InputJsonValue,
                librarySource: "generated",
                isPinned: isPinned ?? true,
            },
        })
        savedAssetCreated = true

        return NextResponse.json({
            asset: mapSavedAssetRecordToGeneratedAsset(savedAsset, {
                viewerUrl: buildSavedAssetViewerUrlForObjectKey(savedAsset.id, savedAsset.objectKey, savedAsset.label),
            }),
        }, { status: 201 })
    } catch (error) {
        if (uploadedObjectKey && !savedAssetCreated) {
            try {
                await deleteAssetObject(uploadedObjectKey)
            } catch (cleanupError) {
                console.warn("Failed to rollback uploaded asset object", {
                    objectKey: uploadedObjectKey,
                    error: cleanupError,
                })
            }
        }
        const message = error instanceof Error ? error.message : "Failed to save asset"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
