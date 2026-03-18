/**
 * E2E Test — fal.ai Neural Generation
 *
 * Tests Hunyuan Shape and TRELLIS 2 via the fal.ai serverless API.
 * Both models are image-to-3D (not text-to-3D), so we use public test images.
 *
 * Usage: npx tsx scripts/test-fal-pipeline.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { createNeuralClient } from "../lib/neural/registry"
import type { GenerationRequest } from "../lib/neural/types"
import fs from "fs"

const DIVIDER = "=".repeat(60)

// Public test images from fal.ai docs
const TEST_IMAGES = {
    robot: "https://storage.googleapis.com/falserverless/model_tests/video_models/robot.png",
    trellisSample: "https://v3b.fal.media/files/b/0a86b60d/xkpao5B0uxmH0tmJm0HVL_2fe35ce1-fe44-475b-b582-6846a149537c.png",
}

async function testProvider(
    slug: "hunyuan-shape" | "trellis",
    request: GenerationRequest
) {
    console.log(`\n${DIVIDER}`)
    console.log(`Testing: ${slug}`)
    console.log(`Mode: ${request.mode}`)
    console.log(`Image: ${request.imageUrl?.slice(0, 60)}...`)
    console.log(DIVIDER)

    try {
        // 1. Create client (should auto-route to fal.ai)
        console.log("\n[1] Creating client...")
        const client = await createNeuralClient(slug)
        console.log(`    Client: ${client.name}`)

        // 2. Health check
        console.log("\n[2] Health check...")
        const healthy = await client.healthCheck()
        console.log(`    Healthy: ${healthy}`)
        if (!healthy) {
            console.error("    ❌ Health check failed — check FAL_KEY")
            return false
        }

        // 3. Generate
        console.log("\n[3] Generating (this may take 30-120s)...")
        const startTime = Date.now()
        const result = await client.generate(request)
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

        console.log(`\n[4] Result:`)
        console.log(`    Status: ${result.status}`)
        console.log(`    Provider: ${result.provider}`)
        console.log(`    Stage: ${result.stage}`)
        console.log(`    Time: ${elapsed}s`)

        if (result.status === "completed" && result.modelPath) {
            const stats = fs.statSync(result.modelPath)
            const sizeKB = (stats.size / 1024).toFixed(1)

            // Verify GLB magic bytes
            const header = Buffer.alloc(4)
            const fd = fs.openSync(result.modelPath, "r")
            fs.readSync(fd, header, 0, 4, 0)
            fs.closeSync(fd)
            const isGLB = header.toString("ascii", 0, 4) === "glTF"

            console.log(`    Model: ${result.modelPath}`)
            console.log(`    Size: ${sizeKB} KB`)
            console.log(`    Valid GLB: ${isGLB ? "✅" : "❌"}`)

            if (!isGLB) {
                console.warn("    ⚠️  File does not have GLB magic bytes — may be a zip or different format")
                // Log first 16 bytes for debugging
                const debugBuf = Buffer.alloc(16)
                const fd2 = fs.openSync(result.modelPath, "r")
                fs.readSync(fd2, debugBuf, 0, 16, 0)
                fs.closeSync(fd2)
                console.warn(`    First 16 bytes: ${debugBuf.toString("hex")}`)
            }

            return true
        } else {
            console.error(`    ❌ Generation failed: ${result.error ?? "unknown error"}`)
            return false
        }
    } catch (err) {
        console.error(`\n❌ Exception: ${err instanceof Error ? err.message : err}`)
        if (err instanceof Error && err.stack) {
            console.error(err.stack)
        }
        return false
    }
}

async function main() {
    console.log("╔══════════════════════════════════════════════════════════╗")
    console.log("║          fal.ai Neural Pipeline E2E Test                ║")
    console.log("╚══════════════════════════════════════════════════════════╝")

    // Check env
    if (!process.env.FAL_KEY) {
        console.error("\n❌ FAL_KEY not found in environment. Add it to .env")
        process.exit(1)
    }
    console.log(`\nFAL_KEY: ${process.env.FAL_KEY.slice(0, 8)}...`)
    console.log(`NEURAL_PROVIDER: ${process.env.NEURAL_PROVIDER ?? "(not set, will auto-detect)"}`)

    const results: { test: string; passed: boolean }[] = []

    // Test 1: Hunyuan Shape (image → 3D with PBR)
    const hunyuanPassed = await testProvider("hunyuan-shape", {
        imageUrl: TEST_IMAGES.robot,
        provider: "hunyuan-shape",
        mode: "image_to_3d",
        outputFormat: "glb",
    })
    results.push({ test: "Hunyuan Shape (image_to_3d)", passed: hunyuanPassed })

    // Test 2: TRELLIS 2 (image → 3D with texture)
    const trellisPassed = await testProvider("trellis", {
        imageUrl: TEST_IMAGES.trellisSample,
        provider: "trellis",
        mode: "image_to_3d",
        outputFormat: "glb",
    })
    results.push({ test: "TRELLIS 2 (image_to_3d)", passed: trellisPassed })

    // Summary
    console.log(`\n${DIVIDER}`)
    console.log("RESULTS SUMMARY")
    console.log(DIVIDER)
    for (const r of results) {
        console.log(`  ${r.passed ? "✅" : "❌"} ${r.test}`)
    }
    const allPassed = results.every((r) => r.passed)
    console.log(`\n${allPassed ? "🎉 All tests passed!" : "⚠️  Some tests failed — see above"}`)

    process.exit(allPassed ? 0 : 1)
}

main()
