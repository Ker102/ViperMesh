import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import { unzipSync } from "fflate"

const ROOT_MODEL_EXTENSIONS = new Set([".glb", ".gltf", ".obj", ".fbx", ".stl"])
const PACKAGE_RESOURCE_EXTENSIONS = new Set([
    ".glb",
    ".gltf",
    ".obj",
    ".fbx",
    ".stl",
    ".mtl",
    ".bin",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".bmp",
    ".gif",
    ".svg",
    ".avif",
    ".ktx",
    ".ktx2",
])

export interface ZipAssetExtractionLimits {
    maxEntries: number
    maxUncompressedBytes: number
    maxFileBytes?: number
}

export interface ExtractedAssetPackageFile {
    entryPath: string
    absolutePath: string
}

export class AssetImportError extends Error {
    status: number

    constructor(message: string, status = 400) {
        super(message)
        this.name = "AssetImportError"
        this.status = status
    }
}

function normalizeArchiveEntryPath(entryName: string): string | null {
    const normalized = path.posix.normalize(entryName.replace(/\\/g, "/"))
    if (!normalized || normalized === "." || normalized.endsWith("/")) {
        return null
    }

    if (normalized.startsWith("/") || normalized.startsWith("../") || normalized.includes("/../")) {
        return null
    }

    if (normalized.startsWith("__MACOSX/")) {
        return null
    }

    return normalized
}

function scoreRootCandidate(candidatePath: string, uploadBasename: string) {
    const normalizedUploadBasename = uploadBasename.toLowerCase()
    const basename = path.posix.basename(candidatePath, path.posix.extname(candidatePath)).toLowerCase()
    const depth = candidatePath.split("/").length
    let score = 0

    if (basename === normalizedUploadBasename) score += 20
    if (basename === "scene") score += 12
    if (basename === "model") score += 8
    if (path.posix.extname(candidatePath).toLowerCase() === ".glb") score += 6
    if (path.posix.extname(candidatePath).toLowerCase() === ".gltf") score += 4
    score -= depth

    return score
}

function pickRootModelPath(entryPaths: string[], uploadFilename: string): string | null {
    const candidates = entryPaths.filter((entryPath) =>
        ROOT_MODEL_EXTENSIONS.has(path.posix.extname(entryPath).toLowerCase()),
    )

    if (candidates.length === 0) {
        return null
    }

    const uploadBasename = path.basename(uploadFilename, path.extname(uploadFilename))
    return [...candidates].sort((left, right) => {
        return scoreRootCandidate(right, uploadBasename) - scoreRootCandidate(left, uploadBasename)
    })[0] ?? null
}

export async function extractZipAssetPackage(
    zipBuffer: Buffer,
    outputDirectory: string,
    uploadFilename: string,
    limits: ZipAssetExtractionLimits,
): Promise<{ rootModelPath: string; rootModelEntryPath: string; extractedFiles: ExtractedAssetPackageFile[] }> {
    const normalizedEntryPaths = new Map<string, string>()
    let totalUncompressedBytes = 0
    let extractedEntryCount = 0

    const archive = unzipSync(new Uint8Array(zipBuffer), {
        filter: (entry) => {
            const entryPath = normalizeArchiveEntryPath(entry.name)
            if (!entryPath) return false

            const fileExtension = path.posix.extname(entryPath).toLowerCase()
            if (!PACKAGE_RESOURCE_EXTENSIONS.has(fileExtension)) return false

            extractedEntryCount += 1
            if (extractedEntryCount > limits.maxEntries) {
                throw new AssetImportError(`ZIP package contains too many supported files. Limit is ${limits.maxEntries}.`)
            }

            if (limits.maxFileBytes && entry.originalSize > limits.maxFileBytes) {
                throw new AssetImportError(`ZIP entry ${entryPath} is larger than the per-file import limit.`)
            }

            totalUncompressedBytes += entry.originalSize
            if (totalUncompressedBytes > limits.maxUncompressedBytes) {
                throw new AssetImportError("ZIP package exceeds the maximum uncompressed import size.")
            }

            normalizedEntryPaths.set(entry.name, entryPath)
            return true
        },
    })
    const archiveEntries = Object.entries(archive)
    const entryPaths = archiveEntries
        .map(([entryName]) => normalizedEntryPaths.get(entryName) ?? normalizeArchiveEntryPath(entryName))
        .filter((entryName): entryName is string => Boolean(entryName))

    const rootModelPath = pickRootModelPath(entryPaths, uploadFilename)
    if (!rootModelPath) {
        throw new AssetImportError("ZIP package must contain a .glb, .gltf, .fbx, .obj, or .stl root model file.")
    }

    await mkdir(outputDirectory, { recursive: true })

    const extractedFiles: ExtractedAssetPackageFile[] = []

    for (const [entryName, entryBuffer] of archiveEntries) {
        const entryPath = normalizedEntryPaths.get(entryName) ?? normalizeArchiveEntryPath(entryName)
        if (!entryPath) continue
        if (!entryBuffer) {
            continue
        }

        const absolutePath = path.join(outputDirectory, ...entryPath.split("/"))
        await mkdir(path.dirname(absolutePath), { recursive: true })
        await writeFile(absolutePath, entryBuffer)
        extractedFiles.push({ entryPath, absolutePath })
        delete archive[entryName]
    }

    return {
        rootModelPath: path.join(outputDirectory, ...rootModelPath.split("/")),
        rootModelEntryPath: rootModelPath,
        extractedFiles,
    }
}
