import path from "node:path"
import { createReadStream } from "node:fs"
import { NextRequest, NextResponse } from "next/server"
import { Readable } from "node:stream"
import { stat } from "node:fs/promises"
import { auth } from "@/lib/auth"
import { userOwnsNeuralOutput } from "@/lib/neural/output-access"
import {
    resolveNeuralOutputPath,
    sanitizeDownloadFilename,
} from "@/lib/neural/output-files"

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const rawPath = request.nextUrl.searchParams.get("path")
    if (!rawPath) {
        return NextResponse.json({ error: "Missing model path" }, { status: 400 })
    }

    const safePath = resolveNeuralOutputPath(rawPath)
    if (!safePath) {
        return NextResponse.json({ error: "Invalid model path" }, { status: 400 })
    }

    const ownsAsset = await userOwnsNeuralOutput(session.user.id, safePath)
    if (!ownsAsset) {
        return NextResponse.json({ error: "Model file not found" }, { status: 404 })
    }

    if (path.extname(safePath).toLowerCase() !== ".glb") {
        return NextResponse.json({ error: "Only .glb neural outputs can be streamed" }, { status: 400 })
    }

    try {
        await stat(safePath)
        const shouldDownload = request.nextUrl.searchParams.get("download") === "1"
        const stream = Readable.toWeb(createReadStream(safePath)) as ReadableStream
        return new NextResponse(stream, {
            headers: {
                "Content-Type": "model/gltf-binary",
                "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${sanitizeDownloadFilename(path.basename(safePath))}"`,
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            },
        })
    } catch {
        return NextResponse.json({ error: "Model file not found" }, { status: 404 })
    }
}
