import { readFile, stat } from "node:fs/promises"

export interface ParsedGlbStats {
    triangleCount: number
    materialCount: number
    textureCount: number
    meshCount: number
    fileSizeBytes: number
}

interface GltfAccessor {
    count?: number
}

interface GltfPrimitive {
    mode?: number
    indices?: number
    attributes?: {
        POSITION?: number
    }
}

interface GltfMesh {
    primitives?: GltfPrimitive[]
}

interface GltfDocument {
    accessors?: GltfAccessor[]
    materials?: unknown[]
    meshes?: GltfMesh[]
    textures?: unknown[]
}

const GLB_MAGIC = 0x46546c67
const GLB_VERSION = 2
const JSON_CHUNK_TYPE = 0x4e4f534a

function parseJsonChunk(glbBuffer: Buffer): GltfDocument {
    if (glbBuffer.length < 20) {
        throw new Error("GLB file is too small")
    }

    const magic = glbBuffer.readUInt32LE(0)
    const version = glbBuffer.readUInt32LE(4)

    if (magic !== GLB_MAGIC || version !== GLB_VERSION) {
        throw new Error("Only GLB version 2 is supported")
    }

    const jsonChunkLength = glbBuffer.readUInt32LE(12)
    const jsonChunkType = glbBuffer.readUInt32LE(16)

    if (jsonChunkType !== JSON_CHUNK_TYPE) {
        throw new Error("GLB JSON chunk is missing")
    }

    const jsonChunkStart = 20
    const jsonChunkEnd = jsonChunkStart + jsonChunkLength
    const jsonPayload = glbBuffer.subarray(jsonChunkStart, jsonChunkEnd).toString("utf8").replace(/\u0000+$/, "")
    return JSON.parse(jsonPayload) as GltfDocument
}

function getTriangleCount(document: GltfDocument): number {
    const accessors = document.accessors ?? []
    let triangles = 0

    for (const mesh of document.meshes ?? []) {
        for (const primitive of mesh.primitives ?? []) {
            const mode = primitive.mode ?? 4
            const indexedCount =
                primitive.indices != null
                    ? accessors[primitive.indices]?.count
                    : accessors[primitive.attributes?.POSITION ?? -1]?.count

            if (!indexedCount || indexedCount < 3) {
                continue
            }

            switch (mode) {
                case 4: // TRIANGLES
                    triangles += Math.floor(indexedCount / 3)
                    break
                case 5: // TRIANGLE_STRIP
                case 6: // TRIANGLE_FAN
                    triangles += Math.max(0, indexedCount - 2)
                    break
                default:
                    break
            }
        }
    }

    return triangles
}

export async function readGlbStats(filePath: string): Promise<ParsedGlbStats> {
    const [fileStats, fileBuffer] = await Promise.all([
        stat(filePath),
        readFile(filePath),
    ])
    const document = parseJsonChunk(fileBuffer)

    return {
        triangleCount: getTriangleCount(document),
        materialCount: document.materials?.length ?? 0,
        textureCount: document.textures?.length ?? 0,
        meshCount: document.meshes?.length ?? 0,
        fileSizeBytes: fileStats.size,
    }
}
