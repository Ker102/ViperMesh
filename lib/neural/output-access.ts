import { prisma } from "@/lib/db"
import {
    buildNeuralOutputFileUrl,
    buildNeuralOutputUrl,
    getImportedNeuralOutputProjectId,
    getNeuralOutputRelativePath,
} from "@/lib/neural/output-files"

function escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

export async function userOwnsNeuralOutput(userId: string, safePath: string): Promise<boolean> {
    const importedProjectId = getImportedNeuralOutputProjectId(safePath)
    if (importedProjectId) {
        const project = await prisma.project.findFirst({
            where: { id: importedProjectId, userId, isDeleted: false },
            select: { id: true },
        })

        return Boolean(project)
    }

    const relativePath = getNeuralOutputRelativePath(safePath)
    if (!relativePath) {
        return false
    }

    const generatedUrl = buildNeuralOutputUrl(safePath)
    const fileUrl = buildNeuralOutputFileUrl(safePath)
    const patterns = [generatedUrl, fileUrl, relativePath].map((value) => `%${escapeLikePattern(value)}%`)

    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT p.id
        FROM "studio_sessions" ss
        INNER JOIN "projects" p ON p.id = ss."projectId"
        WHERE p."userId" = ${userId}
          AND p."isDeleted" = false
          AND (
            ss.steps::text LIKE ${patterns[0]} ESCAPE '\\'
            OR ss.steps::text LIKE ${patterns[1]} ESCAPE '\\'
            OR ss.steps::text LIKE ${patterns[2]} ESCAPE '\\'
          )
        LIMIT 1
    `

    return rows.length > 0
}
