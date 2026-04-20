import path from "node:path"
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

    return NextResponse.json({
        localPath: safePath,
        filename: path.basename(safePath),
    })
}
