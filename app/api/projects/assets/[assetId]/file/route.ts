import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { sanitizeDownloadFilename } from "@/lib/neural/output-files"
import { getModelContentType, getSignedAssetReadUrl } from "@/lib/projects/asset-storage"

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ assetId: string }> },
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetId } = await context.params
    const asset = await prisma.savedAsset.findFirst({
        where: { id: assetId, userId: session.user.id },
        select: { objectKey: true, label: true },
    })

    if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    try {
        const shouldDownload = request.nextUrl.searchParams.get("download") === "1"
        const signedUrl = await getSignedAssetReadUrl({
            key: asset.objectKey,
            downloadName: shouldDownload ? sanitizeDownloadFilename(asset.label) : undefined,
        })
        const upstream = await fetch(signedUrl)
        if (!upstream.ok || !upstream.body) {
            return NextResponse.json({ error: "Asset file not found" }, { status: 404 })
        }

        return new NextResponse(upstream.body, {
            headers: {
                "Content-Type": upstream.headers.get("content-type") ?? getModelContentType(asset.label),
                "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${sanitizeDownloadFilename(asset.label)}"`,
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create signed asset URL"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
