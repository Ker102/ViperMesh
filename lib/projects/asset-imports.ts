import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import { unzipSync } from "fflate"

const ROOT_MODEL_EXTENSIONS = new Set([".glb", ".gltf"])
const PACKAGE_RESOURCE_EXTENSIONS = new Set([
    ".glb",
    ".gltf",
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
): Promise<{ rootModelPath: string }> {
    const archive = unzipSync(new Uint8Array(zipBuffer))
    const entryPaths = Object.keys(archive)
        .map((entryName) => normalizeArchiveEntryPath(entryName))
        .filter((entryName): entryName is string => Boolean(entryName))

    const rootModelPath = pickRootModelPath(entryPaths, uploadFilename)
    if (!rootModelPath) {
        throw new Error("ZIP package must contain a .glb or .gltf root model file")
    }

    await mkdir(outputDirectory, { recursive: true })

    await Promise.all(entryPaths.map(async (entryPath) => {
        const fileExtension = path.posix.extname(entryPath).toLowerCase()
        if (!PACKAGE_RESOURCE_EXTENSIONS.has(fileExtension)) {
            return
        }

        const entryBuffer = archive[entryPath]
        if (!entryBuffer) {
            return
        }

        const absolutePath = path.join(outputDirectory, ...entryPath.split("/"))
        await mkdir(path.dirname(absolutePath), { recursive: true })
        await writeFile(absolutePath, Buffer.from(entryBuffer))
    }))

    return {
        rootModelPath: path.join(outputDirectory, ...rootModelPath.split("/")),
    }
}
