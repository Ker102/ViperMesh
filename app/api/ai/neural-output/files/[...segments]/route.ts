import path from "node:path"
import { readFile } from "node:fs/promises"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveNeuralOutputPath } from "@/lib/neural/output-files"

function getContentType(filePath: string): string {
    switch (path.extname(filePath).toLowerCase()) {
        case ".glb":
            return "model/gltf-binary"
        case ".gltf":
            return "model/gltf+json"
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

    const relativePath = segments.map((segment) => decodeURIComponent(segment)).join("/")
    const safePath = resolveNeuralOutputPath(relativePath)
    if (!safePath) {
        return NextResponse.json({ error: "Invalid asset path" }, { status: 400 })
    }

    try {
        const buffer = await readFile(safePath)
        const shouldDownload = request.nextUrl.searchParams.get("download") === "1"
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": getContentType(safePath),
                "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${path.basename(safePath)}"`,
                "Cache-Control": "no-store",
            },
        })
    } catch {
        return NextResponse.json({ error: "Asset file not found" }, { status: 404 })
    }
}
