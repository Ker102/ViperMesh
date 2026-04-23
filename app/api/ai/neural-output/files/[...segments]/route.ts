import path from "node:path"
import { createReadStream } from "node:fs"
import { NextRequest, NextResponse } from "next/server"
import { Readable } from "node:stream"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import {
    getImportedNeuralOutputProjectId,
    resolveNeuralOutputPath,
    sanitizeDownloadFilename,
} from "@/lib/neural/output-files"

function getContentType(filePath: string): string {
    switch (path.extname(filePath).toLowerCase()) {
        case ".glb":
            return "model/gltf-binary"
        case ".gltf":
            return "model/gltf+json"
        case ".fbx":
            return "model/vnd.autodesk.fbx"
        case ".obj":
            return "model/obj"
        case ".stl":
            return "model/stl"
        case ".mtl":
            return "text/plain; charset=utf-8"
        case ".bin":
            return "application/octet-stream"
        case ".png":
            return "image/png"
        case ".jpg":
        case ".jpeg":
            return "image/jpeg"
        case ".webp":
            return "image/webp"
        case ".gif":
            return "image/gif"
        case ".bmp":
            return "image/bmp"
        case ".svg":
            return "image/svg+xml"
        case ".avif":
            return "image/avif"
        case ".ktx2":
            return "image/ktx2"
        case ".ktx":
            return "image/ktx"
        default:
            return "application/octet-stream"
    }
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ segments?: string[] }> },
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { segments = [] } = await context.params
    if (segments.length === 0) {
        return NextResponse.json({ error: "Missing asset path" }, { status: 400 })
    }

    let relativePath: string
    try {
        relativePath = segments.map((segment) => decodeURIComponent(segment)).join("/")
    } catch {
        return NextResponse.json({ error: "Invalid asset path" }, { status: 400 })
    }

    const safePath = resolveNeuralOutputPath(relativePath)
    if (!safePath) {
        return NextResponse.json({ error: "Invalid asset path" }, { status: 400 })
    }

    const importedProjectId = getImportedNeuralOutputProjectId(safePath)
    if (importedProjectId) {
        const project = await prisma.project.findFirst({
            where: { id: importedProjectId, userId: session.user.id, isDeleted: false },
            select: { id: true },
        })

        if (!project) {
            return NextResponse.json({ error: "Asset file not found" }, { status: 404 })
        }
    }

    try {
        const shouldDownload = request.nextUrl.searchParams.get("download") === "1"
        const stream = Readable.toWeb(createReadStream(safePath)) as ReadableStream
        return new NextResponse(stream, {
            headers: {
                "Content-Type": getContentType(safePath),
                "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${sanitizeDownloadFilename(path.basename(safePath))}"`,
                "Cache-Control": "no-store",
            },
        })
    } catch {
        return NextResponse.json({ error: "Asset file not found" }, { status: 404 })
    }
}
