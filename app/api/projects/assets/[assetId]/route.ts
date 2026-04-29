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
})

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
        select: { id: true },
    })

    if (!existing) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    const data: Prisma.SavedAssetUpdateInput = {}
    if (parsed.data.label !== undefined) data.label = parsed.data.label
    if (parsed.data.isPinned !== undefined) data.isPinned = parsed.data.isPinned

    const savedAsset = await prisma.savedAsset.update({
        where: { id: assetId },
        data,
    })

    return NextResponse.json({
        asset: mapSavedAssetRecordToGeneratedAsset(savedAsset, {
            viewerUrl: buildSavedAssetViewerUrlForObjectKey(savedAsset.id, savedAsset.objectKey),
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
