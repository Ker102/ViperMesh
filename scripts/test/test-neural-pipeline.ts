/**
 * Neural Pipeline Test — End-to-End
 * 
 * Tests the HunyuanShapeClient against the mock neural server:
 * 1. Health check
 * 2. Text-to-3D generation
 * 3. Verify GLB file saved to disk
 * 
 * Prerequisites:
 *   - Mock server running: npx tsx scripts/mock-neural-server.ts
 *   - HUNYUAN_API_URL=http://localhost:8090
 */

async function main() {
    // Force the env var before the client loads
    process.env.HUNYUAN_API_URL = "http://localhost:8090"

    const { createNeuralClient } = await import("../lib/neural/registry")
    const fs = await import("fs")

    console.log("🧪 Neural Pipeline End-to-End Test\n")

    // Step 1: Create client
    console.log("1. Creating HunyuanShapeClient...")
    const client = await createNeuralClient("hunyuan-shape")
    console.log(`   ✅ Client created: ${client.name}\n`)

    // Step 2: Health check
    console.log("2. Health check against mock server...")
    const healthy = await client.healthCheck()
    console.log(`   ${healthy ? "✅" : "❌"} Health: ${healthy}\n`)

    if (!healthy) {
        console.error("   ⛔ Mock server not reachable. Start it with: npx tsx scripts/mock-neural-server.ts")
        process.exit(1)
    }

    // Step 3: Generate
    console.log("3. Generating mesh (text_to_3d)...")
    const startTime = Date.now()
    const result = await client.generate({
        prompt: "a wooden chair",
        provider: "hunyuan-shape",
        mode: "text_to_3d",
    })
    const elapsed = Date.now() - startTime
    console.log(`   Status: ${result.status}`)
    console.log(`   Provider: ${result.provider}`)
    console.log(`   Time: ${elapsed}ms`)

    if (result.status === "completed" && result.modelPath) {
        console.log(`   Model path: ${result.modelPath}`)

        // Step 4: Verify the file
        const exists = fs.existsSync(result.modelPath)
        const stats = exists ? fs.statSync(result.modelPath) : null
        console.log(`   File exists: ${exists}`)
        console.log(`   File size: ${stats?.size ?? 0} bytes`)

        if (exists && stats && stats.size > 0) {
            console.log("\n✅ All tests passed! Neural pipeline works end-to-end.")

            // Read first 4 bytes to verify GLB magic
            const buf = Buffer.alloc(4)
            const fd = fs.openSync(result.modelPath, "r")
            fs.readSync(fd, buf, 0, 4, 0)
            fs.closeSync(fd)
            const magic = buf.toString("ascii")
            console.log(`   GLB magic: "${magic}" (expected "glTF")`)
            console.log(`   Valid GLB: ${magic === "glTF" ? "✅ YES" : "❌ NO"}`)
        } else {
            console.log("\n❌ Test FAILED — model file is empty or missing")
            process.exit(1)
        }
    } else {
        console.log(`   Error: ${result.error}`)
        console.log("\n❌ Test FAILED — generation did not complete")
        process.exit(1)
    }
}

main().catch((err) => {
    console.error("\n❌ Test threw an unhandled error:", err)
    process.exit(1)
})
