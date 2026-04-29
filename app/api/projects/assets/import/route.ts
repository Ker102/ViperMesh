import path from "node:path"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getNeuralOutputRoot } from "@/lib/neural/output-files"
import { readModelStats } from "@/lib/neural/model-stats"
import { extractZipAssetPackage } from "@/lib/projects/asset-imports"
import { deleteAssetObject, getModelContentType, uploadAssetObject } from "@/lib/projects/asset-storage"
import {
    buildSavedAssetObjectKey,
    buildSavedAssetPackageViewerUrl,
    buildSavedAssetViewerUrl,
    mapSavedAssetRecordToGeneratedAsset,
} from "@/lib/projects/saved-assets"

const MAX_IMPORT_SIZE_BYTES = 150 * 1024 * 1024
const MAX_IMPORT_PACKAGE_FILES = 256

function sanitizeBasename(filename: string): string {
    return filename
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "asset"
}

function buildViewerUrlWithFilename(viewerUrl: string, filename: string): string {
    const params = new URLSearchParams({ filename })
    return `${viewerUrl}?${params.toString()}`
}

async function rollbackUploadedObjects(objectKeys: string[]): Promise<void> {
    const cleanupResults = await Promise.allSettled(objectKeys.map((objectKey) => deleteAssetObject(objectKey)))
    cleanupResults.forEach((result, index) => {
        if (result.status === "rejected") {
            console.warn("Failed to rollback uploaded asset object", {
                objectKey: objectKeys[index],
                error: result.reason,
            })
        }
    })
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

    const importId = randomUUID()
    const outputDirectory = path.join(getNeuralOutputRoot(), "imports", projectId)
    const outputFilename = `${Date.now()}-${sanitizeBasename(file.name)}${extension}`
    const absoluteOutputPath = path.join(outputDirectory, outputFilename)
    const uploadedObjectKeys: string[] = []
    let savedAssetCreated = false

    try {
        await mkdir(outputDirectory, { recursive: true })
        const buffer = Buffer.from(await file.arrayBuffer())
        let absoluteViewerPath = absoluteOutputPath
        let rootEntryPath: string | null = null
        let viewerUrl: string
        let objectKey: string

        if (extension === ".zip") {
            const packageDirectory = path.join(outputDirectory, `${Date.now()}-${sanitizeBasename(file.name)}`)
            const extracted = await extractZipAssetPackage(buffer, packageDirectory, file.name, {
                maxEntries: MAX_IMPORT_PACKAGE_FILES,
                maxUncompressedBytes: MAX_IMPORT_SIZE_BYTES,
                maxFileBytes: MAX_IMPORT_SIZE_BYTES,
            })
            absoluteViewerPath = extracted.rootModelPath
            rootEntryPath = extracted.rootModelEntryPath
            objectKey = buildSavedAssetObjectKey({
                userId: session.user.id,
                projectId,
                assetId: importId,
                extension: path.extname(rootEntryPath),
                packagePath: rootEntryPath,
            })
            for (const entry of extracted.extractedFiles) {
                const entryObjectKey = buildSavedAssetObjectKey({
                    userId: session.user.id,
                    projectId,
                    assetId: importId,
                    extension: path.extname(entry.entryPath),
                    packagePath: entry.entryPath,
                })
                const entryContent = await readFile(entry.absolutePath)
                await uploadAssetObject({
                    key: entryObjectKey,
                    body: entryContent,
                    contentType: getModelContentType(entry.entryPath),
                })
                uploadedObjectKeys.push(entryObjectKey)
            }
            viewerUrl = buildSavedAssetPackageViewerUrl(importId, rootEntryPath)
        } else {
            await writeFile(absoluteOutputPath, buffer)
            objectKey = buildSavedAssetObjectKey({
                userId: session.user.id,
                projectId,
                assetId: importId,
                extension,
            })
            await uploadAssetObject({
                key: objectKey,
                body: buffer,
                contentType: getModelContentType(file.name),
            })
            uploadedObjectKeys.push(objectKey)
            viewerUrl = buildViewerUrlWithFilename(buildSavedAssetViewerUrl(importId), file.name)
        }

        const stats = await readModelStats(absoluteViewerPath)
        const title = extension === ".zip" && rootEntryPath
            ? path.basename(rootEntryPath)
            : file.name
        const assetStats = {
            ...stats,
            sourceToolId: "asset-library-import",
            sourceToolLabel: "Imported asset",
            sourceProvider: "Cloudflare R2",
            stageLabel: "Imported",
        }
        const savedAsset = await prisma.savedAsset.create({
            data: {
                id: importId,
                userId: session.user.id,
                projectId,
                label: title,
                objectKey,
                viewerUrl,
                fileSizeBytes: stats.fileSizeBytes,
                assetStats: assetStats as Prisma.InputJsonValue,
                librarySource: "imported",
                isPinned: false,
            },
        })
        savedAssetCreated = true

        return NextResponse.json({
            asset: mapSavedAssetRecordToGeneratedAsset(savedAsset, { viewerUrl }),
        })
    } catch (error) {
        if (!savedAssetCreated && uploadedObjectKeys.length > 0) {
            await rollbackUploadedObjects(uploadedObjectKeys)
        }
        const message = error instanceof Error ? error.message : "Failed to import model"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
