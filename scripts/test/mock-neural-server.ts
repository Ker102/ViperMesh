/**
 * Mock Neural Server — Returns minimal valid GLB files for testing
 *
 * Usage:
 *   npx tsx scripts/mock-neural-server.ts
 *   npm run mock:neural
 *
 * Endpoints:
 *   GET  /health    → 200 { status: "ok" }
 *   POST /generate  → 200 (binary GLB — minimal cube mesh)
 */

import http from "http"

const PORT = Number(process.env.MOCK_NEURAL_PORT || 8090)

/**
 * Minimal valid glTF-Binary (GLB) containing a cube mesh.
 * This is a ~1.6KB binary that Blender can import successfully.
 *
 * Structure:
 *   - 12-byte GLB header (magic, version 2, total length)
 *   - JSON chunk with scene, mesh, accessors, bufferViews, buffer
 *   - Binary chunk with vertex positions (8 vertices) + indices (12 triangles)
 */
function createMinimalGLB(): Buffer {
    // ── Geometry data ──────────────────────────────────────────
    // Cube vertices: 8 corners, 3 floats each (x, y, z)
    const positions = new Float32Array([
        -0.5, -0.5, 0.5,   // 0: front-bottom-left
        0.5, -0.5, 0.5,   // 1: front-bottom-right
        0.5, 0.5, 0.5,   // 2: front-top-right
        -0.5, 0.5, 0.5,   // 3: front-top-left
        -0.5, -0.5, -0.5,   // 4: back-bottom-left
        0.5, -0.5, -0.5,   // 5: back-bottom-right
        0.5, 0.5, -0.5,   // 6: back-top-right
        -0.5, 0.5, -0.5,   // 7: back-top-left
    ])

    // 12 triangles (2 per face × 6 faces)
    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,   // front
        1, 5, 6, 1, 6, 2,   // right
        5, 4, 7, 5, 7, 6,   // back
        4, 0, 3, 4, 3, 7,   // left
        3, 2, 6, 3, 6, 7,   // top
        4, 5, 1, 4, 1, 0,   // bottom
    ])

    const positionBytes = Buffer.from(positions.buffer)
    const indexBytes = Buffer.from(indices.buffer)
    const binData = Buffer.concat([positionBytes, indexBytes])

    // ── JSON scene description ─────────────────────────────────
    const json = {
        asset: { version: "2.0", generator: "ModelForge Mock Neural Server" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, name: "NeuralMeshOutput" }],
        meshes: [{
            primitives: [{
                attributes: { POSITION: 0 },
                indices: 1,
            }],
        }],
        accessors: [
            {
                bufferView: 0,
                componentType: 5126, // FLOAT
                count: 8,
                type: "VEC3",
                max: [0.5, 0.5, 0.5],
                min: [-0.5, -0.5, -0.5],
            },
            {
                bufferView: 1,
                componentType: 5123, // UNSIGNED_SHORT
                count: 36,
                type: "SCALAR",
            },
        ],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: positionBytes.length, target: 34962 },
            { buffer: 0, byteOffset: positionBytes.length, byteLength: indexBytes.length, target: 34963 },
        ],
        buffers: [{ byteLength: binData.length }],
    }

    const jsonStr = JSON.stringify(json)
    // Pad to 4-byte alignment
    const jsonPadded = jsonStr + " ".repeat((4 - (jsonStr.length % 4)) % 4)
    const jsonBuf = Buffer.from(jsonPadded, "utf-8")

    // Pad binary to 4-byte alignment
    const binPadding = (4 - (binData.length % 4)) % 4
    const binBuf = binPadding > 0
        ? Buffer.concat([binData, Buffer.alloc(binPadding)])
        : binData

    // ── GLB assembly ───────────────────────────────────────────
    const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuf.length

    const glb = Buffer.alloc(totalLength)
    let offset = 0

    // Header
    glb.writeUInt32LE(0x46546C67, offset); offset += 4  // magic "glTF"
    glb.writeUInt32LE(2, offset); offset += 4  // version 2
    glb.writeUInt32LE(totalLength, offset); offset += 4  // total length

    // JSON chunk
    glb.writeUInt32LE(jsonBuf.length, offset); offset += 4  // chunk length
    glb.writeUInt32LE(0x4E4F534A, offset); offset += 4  // chunk type "JSON"
    jsonBuf.copy(glb, offset); offset += jsonBuf.length

    // Binary chunk
    glb.writeUInt32LE(binBuf.length, offset); offset += 4  // chunk length
    glb.writeUInt32LE(0x004E4942, offset); offset += 4  // chunk type "BIN\0"
    binBuf.copy(glb, offset)

    return glb
}

// Pre-generate the GLB so we don't rebuild on every request
const MOCK_GLB = createMinimalGLB()

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        res.writeHead(204)
        res.end()
        return
    }

    // Health check
    if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ status: "ok", provider: "mock-neural-server" }))
        return
    }

    // Generate endpoint — returns minimal GLB
    if (req.url === "/generate" && req.method === "POST") {
        // Collect the request body (we don't use it, but consume it)
        const chunks: Buffer[] = []
        req.on("data", (chunk: Buffer) => chunks.push(chunk))
        req.on("end", () => {
            const body = Buffer.concat(chunks).toString("utf-8")
            console.log(`[mock-neural] /generate request received (${body.length} bytes)`)

            // Simulate ~1s processing time
            setTimeout(() => {
                res.writeHead(200, {
                    "Content-Type": "model/gltf-binary",
                    "Content-Length": String(MOCK_GLB.length),
                })
                res.end(MOCK_GLB)
                console.log(`[mock-neural] Returned ${MOCK_GLB.length} byte GLB`)
            }, 1000)
        })
        return
    }

    // 404
    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Not found" }))
})

server.listen(PORT, () => {
    console.log(`\n🧠 Mock Neural Server running on http://localhost:${PORT}`)
    console.log(`   GET  /health   → health check`)
    console.log(`   POST /generate → returns minimal GLB cube mesh\n`)
})
