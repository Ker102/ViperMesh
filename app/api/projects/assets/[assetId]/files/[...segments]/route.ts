import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { sanitizeDownloadFilename } from "@/lib/neural/output-files"
import { getModelContentType, getSignedAssetReadUrl } from "@/lib/projects/asset-storage"
import { getSavedAssetPackagePrefix } from "@/lib/projects/saved-assets"

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ assetId: string; segments?: string[] }> },
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetId, segments = [] } = await context.params
    if (segments.length === 0) {
        return NextResponse.json({ error: "Missing package file path" }, { status: 400 })
    }

    const asset = await prisma.savedAsset.findFirst({
        where: { id: assetId, userId: session.user.id },
        select: { objectKey: true, label: true },
    })

    if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    const packagePrefix = getSavedAssetPackagePrefix(asset.objectKey)
    if (!packagePrefix) {
        return NextResponse.json({ error: "Asset is not a package" }, { status: 400 })
    }

    if (segments.some((segment) => segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))) {
        return NextResponse.json({ error: "Invalid package file path" }, { status: 400 })
    }

    const relativePath = segments.join("/")
    const objectKey = `${packagePrefix}${segments.map((segment) => encodeURIComponent(segment)).join("/")}`

    try {
        const shouldDownload = request.nextUrl.searchParams.get("download") === "1"
        const signedUrl = await getSignedAssetReadUrl({
            key: objectKey,
            downloadName: shouldDownload ? sanitizeDownloadFilename(asset.label) : undefined,
        })
        const upstream = await fetch(signedUrl)
        if (!upstream.ok || !upstream.body) {
            return NextResponse.json({ error: "Asset file not found" }, { status: 404 })
        }

        return new NextResponse(upstream.body, {
            headers: {
                "Content-Type": upstream.headers.get("content-type") ?? getModelContentType(relativePath),
                "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${sanitizeDownloadFilename(segments.at(-1) ?? asset.label)}"`,
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create signed asset URL"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
