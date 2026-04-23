import { realpathSync, statSync } from "node:fs"
import path from "node:path"

const DEFAULT_OUTPUT_ROOT = path.resolve(
    process.env.NEURAL_3D_OUTPUT_DIR ?? path.join(process.cwd(), "tmp", "neural-output"),
)

export function getNeuralOutputRoot(): string {
    return DEFAULT_OUTPUT_ROOT
}

function getCanonicalPath(candidatePath: string): string | null {
    try {
        return realpathSync(candidatePath)
    } catch {
        return null
    }
}

function getCanonicalOutputRoot(): string {
    return getCanonicalPath(DEFAULT_OUTPUT_ROOT) ?? DEFAULT_OUTPUT_ROOT
}

export function resolveNeuralOutputPath(candidatePath: string): string | null {
    const outputRoot = getCanonicalOutputRoot()
    const resolvedPath = path.isAbsolute(candidatePath)
        ? candidatePath
        : path.resolve(getNeuralOutputRoot(), candidatePath)
    const canonicalPath = getCanonicalPath(resolvedPath)

    if (!canonicalPath) {
        return null
    }

    if (
        canonicalPath === outputRoot ||
        !canonicalPath.startsWith(`${outputRoot}${path.sep}`)
    ) {
        return null
    }

    try {
        const stats = statSync(canonicalPath)
        return stats.isFile() ? canonicalPath : null
    } catch {
        return null
    }
}

export function buildNeuralOutputUrl(modelPath: string): string {
    const relativePath = getNeuralOutputRelativePath(modelPath)
    if (!relativePath) {
        throw new Error("Neural output path must resolve inside the output directory")
    }

    return `/api/ai/neural-output?path=${encodeURIComponent(relativePath)}`
}

export function buildNeuralOutputFileUrl(modelPath: string): string {
    const relativePath = getNeuralOutputRelativePath(modelPath)
    if (!relativePath) {
        throw new Error("Neural output path must resolve inside the output directory")
    }

    const encodedSegments = relativePath
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/")

    return `/api/ai/neural-output/files/${encodedSegments}`
}

export function getNeuralOutputRelativePath(candidatePath: string): string | null {
    const safePath = resolveNeuralOutputPath(candidatePath)
    if (!safePath) {
        return null
    }

    return path.relative(getCanonicalOutputRoot(), safePath).split(path.sep).join("/")
}

export function getImportedNeuralOutputProjectId(candidatePath: string): string | null {
    const relativePath = getNeuralOutputRelativePath(candidatePath)
    if (!relativePath) {
        return null
    }

    const segments = relativePath.split("/").filter(Boolean)
    if (segments[0] !== "imports") {
        return null
    }

    return segments[1] ?? null
}

export function sanitizeDownloadFilename(filename: string): string {
    const sanitized = filename
        .replace(/[\r\n"]/g, "_")
        .replace(/[^\x20-\x7E]/g, "_")
        .trim()

    return sanitized || "download"
}

export function extractNeuralOutputRelativePath(candidateUrl: string): string | null {
    try {
        const baseUrl =
            typeof window !== "undefined"
                ? window.location.origin
                : "http://127.0.0.1"
        const parsed = new URL(candidateUrl, baseUrl)
        if (parsed.pathname === "/api/ai/neural-output") {
            const relativePath = parsed.searchParams.get("path")
            return relativePath || null
        }

        const pathPrefix = "/api/ai/neural-output/files/"
        if (parsed.pathname.startsWith(pathPrefix)) {
            return parsed.pathname
                .slice(pathPrefix.length)
                .split("/")
                .map((segment) => decodeURIComponent(segment))
                .join("/")
        }

        return null
    } catch {
        return null
    }
}
