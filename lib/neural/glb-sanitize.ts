const GLB_MAGIC = 0x46546c67
const JSON_CHUNK_TYPE = 0x4e4f534a
const GLB_HEADER_SIZE = 12
const GLB_CHUNK_HEADER_SIZE = 8

const REMOVABLE_TEXTURE_EXTENSIONS = new Set([
    "EXT_texture_webp",
    "KHR_texture_basisu",
    "KHR_texture_transform",
])

function isGlbBuffer(buffer: Buffer): boolean {
    return buffer.length >= GLB_HEADER_SIZE && buffer.readUInt32LE(0) === GLB_MAGIC
}

function padJsonChunk(json: string): Buffer {
    const raw = Buffer.from(json, "utf8")
    const paddedLength = Math.ceil(raw.length / 4) * 4
    const padded = Buffer.alloc(paddedLength, 0x20)
    raw.copy(padded)
    return padded
}

function stripTextureExtensions(gltf: Record<string, unknown>) {
    for (const key of ["extensionsUsed", "extensionsRequired"] as const) {
        const value = gltf[key]
        if (!Array.isArray(value)) continue

        gltf[key] = value.filter((entry) => {
            if (typeof entry !== "string") return false
            if (entry.startsWith("KHR_materials_")) return false
            return !REMOVABLE_TEXTURE_EXTENSIONS.has(entry)
        })

        if (Array.isArray(gltf[key]) && (gltf[key] as unknown[]).length === 0) {
            delete gltf[key]
        }
    }
}

export function sanitizeGlbForPaint(buffer: Buffer): Buffer {
    if (!isGlbBuffer(buffer)) {
        return buffer
    }

    const version = buffer.readUInt32LE(4)
    const totalLength = buffer.readUInt32LE(8)
    if (version !== 2 || totalLength > buffer.length) {
        return buffer
    }

    let offset = GLB_HEADER_SIZE
    const chunks: { length: number; type: number; data: Buffer }[] = []

    while (offset + GLB_CHUNK_HEADER_SIZE <= buffer.length) {
        const chunkLength = buffer.readUInt32LE(offset)
        const chunkType = buffer.readUInt32LE(offset + 4)
        const dataStart = offset + GLB_CHUNK_HEADER_SIZE
        const dataEnd = dataStart + chunkLength
        if (dataEnd > buffer.length) {
            return buffer
        }

        chunks.push({
            length: chunkLength,
            type: chunkType,
            data: buffer.subarray(dataStart, dataEnd),
        })
        offset = dataEnd
    }

    const jsonChunk = chunks.find((chunk) => chunk.type === JSON_CHUNK_TYPE)
    if (!jsonChunk) {
        return buffer
    }

    const gltf = JSON.parse(jsonChunk.data.toString("utf8")) as Record<string, unknown>
    const hasTexturePayload =
        Array.isArray(gltf.images) ||
        Array.isArray(gltf.textures) ||
        Array.isArray(gltf.materials)

    if (!hasTexturePayload) {
        return buffer
    }

    if (Array.isArray(gltf.meshes)) {
        for (const mesh of gltf.meshes) {
            if (!mesh || typeof mesh !== "object") continue
            const primitives = (mesh as { primitives?: unknown[] }).primitives
            if (!Array.isArray(primitives)) continue
            for (const primitive of primitives) {
                if (!primitive || typeof primitive !== "object") continue
                delete (primitive as { material?: unknown }).material
            }
        }
    }

    delete gltf.images
    delete gltf.textures
    delete gltf.samplers
    delete gltf.materials
    stripTextureExtensions(gltf)

    const newJsonData = padJsonChunk(JSON.stringify(gltf))
    const rebuiltChunks = chunks.map((chunk) =>
        chunk.type === JSON_CHUNK_TYPE
            ? {
                  type: JSON_CHUNK_TYPE,
                  data: newJsonData,
              }
            : {
                  type: chunk.type,
                  data: chunk.data,
              },
    )

    const rebuiltLength =
        GLB_HEADER_SIZE +
        rebuiltChunks.reduce(
            (sum, chunk) => sum + GLB_CHUNK_HEADER_SIZE + chunk.data.length,
            0,
        )

    const out = Buffer.alloc(rebuiltLength)
    out.writeUInt32LE(GLB_MAGIC, 0)
    out.writeUInt32LE(2, 4)
    out.writeUInt32LE(rebuiltLength, 8)

    let writeOffset = GLB_HEADER_SIZE
    for (const chunk of rebuiltChunks) {
        out.writeUInt32LE(chunk.data.length, writeOffset)
        out.writeUInt32LE(chunk.type, writeOffset + 4)
        chunk.data.copy(out, writeOffset + GLB_CHUNK_HEADER_SIZE)
        writeOffset += GLB_CHUNK_HEADER_SIZE + chunk.data.length
    }

    return out
}
