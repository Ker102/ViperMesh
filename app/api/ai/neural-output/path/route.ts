import path from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { userOwnsNeuralOutput } from "@/lib/neural/output-access"
import {
    getNeuralOutputRelativePath,
    resolveNeuralOutputPath,
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

    const relativePath = getNeuralOutputRelativePath(safePath)
    if (!relativePath) {
        return NextResponse.json({ error: "Invalid model path" }, { status: 400 })
    }

    return NextResponse.json({
        relativePath,
        filename: path.basename(safePath),
    })
}
