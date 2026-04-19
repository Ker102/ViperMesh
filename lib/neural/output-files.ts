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
    const safePath = resolveNeuralOutputPath(modelPath)
    if (!safePath) {
        throw new Error("Neural output path must resolve inside the output directory")
    }

    const relativePath = path.relative(getCanonicalOutputRoot(), safePath).split(path.sep).join("/")
    return `/api/ai/neural-output?path=${encodeURIComponent(relativePath)}`
}

export function extractNeuralOutputRelativePath(candidateUrl: string): string | null {
    try {
        const baseUrl =
            typeof window !== "undefined"
                ? window.location.origin
                : "http://127.0.0.1"
        const parsed = new URL(candidateUrl, baseUrl)
        const relativePath = parsed.searchParams.get("path")
        return relativePath ? decodeURIComponent(relativePath) : null
    } catch {
        return null
    }
}
