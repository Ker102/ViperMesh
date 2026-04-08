import path from "node:path"
import { readFile } from "node:fs/promises"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveNeuralOutputPath } from "@/lib/neural/output-files"

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
    if (path.extname(safePath).toLowerCase() !== ".glb") {
        return NextResponse.json({ error: "Only .glb neural outputs can be streamed" }, { status: 400 })
    }

    try {
        const buffer = await readFile(safePath)
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": "model/gltf-binary",
                "Content-Disposition": `inline; filename="${path.basename(safePath)}"`,
                "Cache-Control": "no-store",
            },
        })
    } catch {
        return NextResponse.json({ error: "Model file not found" }, { status: 404 })
    }
}
