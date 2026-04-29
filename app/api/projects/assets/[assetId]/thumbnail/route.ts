import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { sanitizeDownloadFilename } from "@/lib/neural/output-files"
import {
    getSignedAssetReadUrl,
    uploadAssetObject,
} from "@/lib/projects/asset-storage"
import {
    buildSavedAssetPreviewObjectKey,
    buildSavedAssetThumbnailUrl,
    buildSavedAssetViewerUrlForObjectKey,
    mapSavedAssetRecordToGeneratedAsset,
} from "@/lib/projects/saved-assets"

const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024

function decodePngDataUrl(imageDataUrl: unknown): Buffer | null {
    if (typeof imageDataUrl !== "string") return null

    const match = imageDataUrl.match(/^data:image\/png;base64,([a-z0-9+/=\s]+)$/i)
    if (!match?.[1]) return null

    const buffer = Buffer.from(match[1].replace(/\s/g, ""), "base64")
    if (buffer.length <= 0 || buffer.length > MAX_THUMBNAIL_BYTES) return null
    return buffer
}

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ assetId: string }> },
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetId } = await context.params
    const asset = await prisma.savedAsset.findFirst({
        where: { id: assetId, userId: session.user.id },
        select: { previewObjectKey: true, label: true },
    })

    if (!asset?.previewObjectKey) {
        return NextResponse.json({ error: "Asset thumbnail not found" }, { status: 404 })
    }

    try {
        const signedUrl = await getSignedAssetReadUrl({ key: asset.previewObjectKey })
        const upstream = await fetch(signedUrl)
        if (!upstream.ok || !upstream.body) {
            return NextResponse.json({ error: "Asset thumbnail not found" }, { status: 404 })
        }

        return new NextResponse(upstream.body, {
            headers: {
                "Content-Type": upstream.headers.get("content-type") ?? "image/png",
                "Content-Disposition": `inline; filename="${sanitizeDownloadFilename(asset.label)}-preview.png"`,
                "Cache-Control": "private, max-age=300",
                "X-Content-Type-Options": "nosniff",
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load asset thumbnail"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ assetId: string }> },
) {
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

    const imageBuffer = decodePngDataUrl((body as { imageDataUrl?: unknown } | null)?.imageDataUrl)
    if (!imageBuffer) {
        return NextResponse.json({ error: "Thumbnail must be a PNG data URL under 2 MB" }, { status: 400 })
    }

    const { assetId } = await context.params
    const asset = await prisma.savedAsset.findFirst({
        where: { id: assetId, userId: session.user.id },
        select: {
            id: true,
            userId: true,
            projectId: true,
            objectKey: true,
        },
    })

    if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    if (!asset.projectId) {
        return NextResponse.json({ error: "Project asset thumbnails require a project" }, { status: 400 })
    }

    try {
        const previewObjectKey = buildSavedAssetPreviewObjectKey({
            userId: asset.userId,
            projectId: asset.projectId,
            assetId: asset.id,
        })
        const previewUrl = buildSavedAssetThumbnailUrl(asset.id)

        await uploadAssetObject({
            key: previewObjectKey,
            body: imageBuffer,
            contentType: "image/png",
        })

        const savedAsset = await prisma.savedAsset.update({
            where: { id: asset.id },
            data: {
                previewObjectKey,
                previewUrl,
            },
        })

        return NextResponse.json({
            asset: mapSavedAssetRecordToGeneratedAsset(savedAsset, {
                viewerUrl: buildSavedAssetViewerUrlForObjectKey(savedAsset.id, savedAsset.objectKey),
            }),
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save asset thumbnail"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
