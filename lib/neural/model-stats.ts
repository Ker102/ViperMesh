import path from "node:path"
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

const EMPTY_MODEL_COUNTS = {
    triangleCount: 0,
    materialCount: 0,
    textureCount: 0,
    meshCount: 0,
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

function parseGltfDocument(gltfBuffer: Buffer): GltfDocument {
    return JSON.parse(gltfBuffer.toString("utf8")) as GltfDocument
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

async function readStatsForDocument(filePath: string, document: GltfDocument): Promise<ParsedGlbStats> {
    const fileStats = await stat(filePath)

    return {
        triangleCount: getTriangleCount(document),
        materialCount: document.materials?.length ?? 0,
        textureCount: document.textures?.length ?? 0,
        meshCount: document.meshes?.length ?? 0,
        fileSizeBytes: fileStats.size,
    }
}

async function readGenericFileStats(filePath: string, partial?: Partial<ParsedGlbStats>): Promise<ParsedGlbStats> {
    const fileStats = await stat(filePath)
    return {
        ...EMPTY_MODEL_COUNTS,
        fileSizeBytes: fileStats.size,
        ...partial,
    }
}

function countObjTriangles(objSource: string) {
    let triangles = 0
    let meshCount = 0
    const materials = new Set<string>()

    for (const rawLine of objSource.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith("#")) {
            continue
        }

        if (line.startsWith("o ") || line.startsWith("g ")) {
            meshCount += 1
            continue
        }

        if (line.startsWith("usemtl ")) {
            const materialName = line.slice(7).trim()
            if (materialName) {
                materials.add(materialName)
            }
            continue
        }

        if (!line.startsWith("f ")) {
            continue
        }

        const vertices = line
            .slice(2)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
        if (vertices.length >= 3) {
            triangles += Math.max(0, vertices.length - 2)
        }
    }

    return {
        triangleCount: triangles,
        materialCount: materials.size,
        meshCount: Math.max(meshCount, triangles > 0 ? 1 : 0),
    }
}

function countStlTriangles(stlBuffer: Buffer) {
    if (stlBuffer.length >= 84) {
        const expectedFaceCount = stlBuffer.readUInt32LE(80)
        const expectedBinaryLength = 84 + expectedFaceCount * 50
        if (expectedBinaryLength === stlBuffer.length) {
            return expectedFaceCount
        }
    }

    const asciiSource = stlBuffer.toString("utf8")
    const facetMatches = asciiSource.match(/\bfacet\s+normal\b/gi)
    return facetMatches?.length ?? 0
}

export async function readModelStats(filePath: string): Promise<ParsedGlbStats> {
    const extension = path.extname(filePath).toLowerCase()
    const fileBuffer = await readFile(filePath)

    if (extension === ".glb") {
        const document = parseJsonChunk(fileBuffer)
        return readStatsForDocument(filePath, document)
    }

    if (extension === ".gltf") {
        const document = parseGltfDocument(fileBuffer)
        return readStatsForDocument(filePath, document)
    }

    if (extension === ".obj") {
        return readGenericFileStats(filePath, countObjTriangles(fileBuffer.toString("utf8")))
    }

    if (extension === ".stl") {
        return readGenericFileStats(filePath, {
            triangleCount: countStlTriangles(fileBuffer),
            meshCount: 1,
        })
    }

    if (extension === ".fbx") {
        return readGenericFileStats(filePath, { meshCount: 1 })
    }

    throw new Error("Only GLB, GLTF, OBJ, STL, and FBX model stats are supported")
}

export async function readGlbStats(filePath: string): Promise<ParsedGlbStats> {
    if (path.extname(filePath).toLowerCase() !== ".glb") {
        throw new Error("Only GLB version 2 is supported")
    }

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
