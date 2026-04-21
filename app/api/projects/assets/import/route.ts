import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { buildNeuralOutputUrl, getNeuralOutputRoot } from "@/lib/neural/output-files"
import { readGlbStats } from "@/lib/neural/model-stats"

const MAX_IMPORT_SIZE_BYTES = 150 * 1024 * 1024

function sanitizeBasename(filename: string): string {
    return filename
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "asset"
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 })
    }

    const projectId = formData.get("projectId")
    const file = formData.get("file")

    if (typeof projectId !== "string") {
        return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "A GLB file is required" }, { status: 400 })
    }

    if (path.extname(file.name).toLowerCase() !== ".glb") {
        return NextResponse.json({ error: "Only .glb files can be imported right now" }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_IMPORT_SIZE_BYTES) {
        return NextResponse.json({
            error: `Imported models must be between 1 byte and ${Math.round(MAX_IMPORT_SIZE_BYTES / (1024 * 1024))} MB`,
        }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id, isDeleted: false },
        select: { id: true },
    })

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const importId = `asset-${randomUUID()}`
    const outputDirectory = path.join(getNeuralOutputRoot(), "imports", projectId)
    const outputFilename = `${Date.now()}-${sanitizeBasename(file.name)}.glb`
    const absoluteOutputPath = path.join(outputDirectory, outputFilename)

    try {
        await mkdir(outputDirectory, { recursive: true })
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(absoluteOutputPath, buffer)
        const stats = await readGlbStats(absoluteOutputPath)

        return NextResponse.json({
            asset: {
                id: importId,
                stepId: importId,
                title: file.name,
                toolName: "asset-library-import",
                toolLabel: "Imported asset",
                viewerUrl: buildNeuralOutputUrl(absoluteOutputPath),
                viewerLabel: file.name,
                providerLabel: "Local upload",
                stageLabel: "Imported",
                previewImageUrl: undefined,
                assetStats: {
                    ...stats,
                    sourceToolId: "asset-library-import",
                    sourceToolLabel: "Imported asset",
                    sourceProvider: "Local upload",
                    stageLabel: "Imported",
                },
                referenceImage: undefined,
                nextSuggestions: [],
                librarySource: "imported",
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to import model"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
