import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import {
    buildSavedAssetViewerUrlForObjectKey,
    mapSavedAssetRecordToGeneratedAsset,
} from "@/lib/projects/saved-assets"

const updateAssetSchema = z.object({
    label: z.string().min(1).max(255).optional(),
    isPinned: z.boolean().optional(),
    tags: z.array(z.string().min(1).max(32)).max(8).optional(),
    categoryId: z.enum(["textured", "geometry", "images"]).nullable().optional(),
})

function normalizeExistingStats(stats: Prisma.JsonValue | null): Record<string, unknown> {
    if (!stats || typeof stats !== "object" || Array.isArray(stats)) {
        return {}
    }
    return { ...(stats as Record<string, unknown>) }
}

function normalizeTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 8)
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ assetId: string }> },
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetId } = await context.params
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const parsed = updateAssetSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.savedAsset.findFirst({
        where: { id: assetId, userId: session.user.id },
        select: { id: true, assetStats: true },
    })

    if (!existing) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    const data: Prisma.SavedAssetUpdateInput = {}
    if (parsed.data.label !== undefined) data.label = parsed.data.label.trim()
    if (parsed.data.isPinned !== undefined) data.isPinned = parsed.data.isPinned
    if (parsed.data.tags !== undefined || parsed.data.categoryId !== undefined) {
        const assetStats = normalizeExistingStats(existing.assetStats)
        if (parsed.data.tags !== undefined) {
            assetStats.userTags = normalizeTags(parsed.data.tags)
        }
        if (parsed.data.categoryId !== undefined) {
            if (parsed.data.categoryId) {
                assetStats.libraryCategoryOverride = parsed.data.categoryId
            } else {
                delete assetStats.libraryCategoryOverride
            }
        }
        data.assetStats = assetStats as Prisma.InputJsonValue
    }

    const savedAsset = await prisma.savedAsset.update({
        where: { id: assetId },
        data,
    })

    return NextResponse.json({
        asset: mapSavedAssetRecordToGeneratedAsset(savedAsset, {
            viewerUrl: buildSavedAssetViewerUrlForObjectKey(savedAsset.id, savedAsset.objectKey, savedAsset.label),
        }),
    })
}

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ assetId: string }> },
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetId } = await context.params
    const existing = await prisma.savedAsset.findFirst({
        where: { id: assetId, userId: session.user.id },
        select: { id: true },
    })

    if (!existing) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    await prisma.savedAsset.delete({ where: { id: assetId } })
    return NextResponse.json({ ok: true })
}
