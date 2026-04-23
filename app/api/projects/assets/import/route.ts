import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { buildNeuralOutputFileUrl, buildNeuralOutputUrl, getNeuralOutputRoot } from "@/lib/neural/output-files"
import { readModelStats } from "@/lib/neural/model-stats"
import { extractZipAssetPackage } from "@/lib/projects/asset-imports"

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
        return NextResponse.json({ error: "A model file or ZIP package is required" }, { status: 400 })
    }

    const extension = path.extname(file.name).toLowerCase()
    if (![".glb", ".gltf", ".fbx", ".obj", ".stl", ".zip"].includes(extension)) {
        return NextResponse.json({
            error: "Import supports .glb, .gltf, .fbx, .obj, .stl, or a ZIP package containing one of those assets with its resources",
        }, { status: 400 })
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
    const outputFilename = `${Date.now()}-${sanitizeBasename(file.name)}${extension}`
    const absoluteOutputPath = path.join(outputDirectory, outputFilename)

    try {
        await mkdir(outputDirectory, { recursive: true })
        const buffer = Buffer.from(await file.arrayBuffer())
        let absoluteViewerPath = absoluteOutputPath
        let viewerUrl: string

        if (extension === ".zip") {
            const packageDirectory = path.join(outputDirectory, `${Date.now()}-${sanitizeBasename(file.name)}`)
            const extracted = await extractZipAssetPackage(buffer, packageDirectory, file.name)
            absoluteViewerPath = extracted.rootModelPath
            viewerUrl = buildNeuralOutputFileUrl(absoluteViewerPath)
        } else {
            await writeFile(absoluteOutputPath, buffer)
            viewerUrl = extension === ".glb"
                ? buildNeuralOutputUrl(absoluteOutputPath)
                : buildNeuralOutputFileUrl(absoluteOutputPath)
        }

        const stats = await readModelStats(absoluteViewerPath)
        const title = path.basename(absoluteViewerPath)

        return NextResponse.json({
            asset: {
                id: importId,
                stepId: importId,
                title,
                toolName: "asset-library-import",
                toolLabel: "Imported asset",
                viewerUrl,
                viewerLabel: title,
                providerLabel: extension === ".zip" ? "Package import" : "Local upload",
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
