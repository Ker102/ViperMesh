import path from "node:path"

const DEFAULT_OUTPUT_ROOT = path.resolve(
    process.env.NEURAL_3D_OUTPUT_DIR ?? path.join(process.cwd(), "tmp", "neural-output"),
)

export function getNeuralOutputRoot(): string {
    return DEFAULT_OUTPUT_ROOT
}

export function resolveNeuralOutputPath(candidatePath: string): string | null {
    const resolvedPath = path.resolve(candidatePath)
    const outputRoot = getNeuralOutputRoot()

    if (
        resolvedPath === outputRoot ||
        resolvedPath.startsWith(`${outputRoot}${path.sep}`)
    ) {
        return resolvedPath
    }

    return null
}

export function buildNeuralOutputUrl(modelPath: string): string {
    return `/api/ai/neural-output?path=${encodeURIComponent(modelPath)}`
}
