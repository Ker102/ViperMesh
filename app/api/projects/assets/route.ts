import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import {
    buildSavedAssetViewerUrlForObjectKey,
    mapSavedAssetRecordToGeneratedAsset,
} from "@/lib/projects/saved-assets"

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const projectId = url.searchParams.get("projectId")
    if (!projectId) {
        return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id, isDeleted: false },
        select: { id: true },
    })

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const savedAssets = await prisma.savedAsset.findMany({
        where: {
            userId: session.user.id,
            projectId,
        },
        orderBy: [
            { isPinned: "desc" },
            { createdAt: "desc" },
        ],
    })

    return NextResponse.json({
        assets: savedAssets.map((asset) =>
            mapSavedAssetRecordToGeneratedAsset(asset, {
                viewerUrl: buildSavedAssetViewerUrlForObjectKey(asset.id, asset.objectKey),
            }),
        ),
    })
}
