/**
 * Vision Module Test Script
 * 
 * Tests the Gemini Vision integration for viewport analysis.
 * Run with: npx tsx scripts/test-vision.ts
 */

import * as fs from "fs"
import * as path from "path"
import { analyzeViewport, describeScene, compareWithExpectation, validateSceneElements } from "../lib/ai/vision"

async function main() {
    console.log("🔍 ModelForge Vision Module Tests\n")
    console.log("=".repeat(50))

    // Check for test image or use placeholder
    const testImagePath = path.join(__dirname, "test-viewport.png")
    let testImageBase64: string

    if (fs.existsSync(testImagePath)) {
        console.log("📷 Using test image:", testImagePath)
        const imageBuffer = fs.readFileSync(testImagePath)
        testImageBase64 = imageBuffer.toString("base64")
    } else {
        console.log("⚠️  No test image found. Using placeholder for API test.")
        console.log("   To test with real image: save a Blender screenshot as scripts/test-viewport.png\n")

        // Create a minimal valid PNG (1x1 pixel)
        const minimalPng = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        testImageBase64 = minimalPng.toString("base64")
    }

    // Test 1: Describe Scene
    console.log("\n📋 Test 1: describeScene()")
    console.log("-".repeat(40))
    try {
        const description = await describeScene(testImageBase64)
        console.log("✅ Description:", description)
    } catch (error) {
        console.log("❌ Error:", error instanceof Error ? error.message : error)
    }

    // Test 2: Analyze Viewport
    console.log("\n📋 Test 2: analyzeViewport()")
    console.log("-".repeat(40))
    try {
        const analysis = await analyzeViewport(testImageBase64, "Create a 3D scene with objects")
        console.log("✅ Assessment:", analysis.assessment)
        console.log("   Description:", analysis.description)
        console.log("   Objects:", analysis.objects.join(", ") || "(none detected)")
        console.log("   Issues:", analysis.issues.join(", ") || "(none)")
        console.log("   Confidence:", (analysis.confidence * 100).toFixed(1) + "%")
    } catch (error) {
        console.log("❌ Error:", error instanceof Error ? error.message : error)
    }

    // Test 3: Compare with Expectation
    console.log("\n📋 Test 3: compareWithExpectation()")
    console.log("-".repeat(40))
    try {
        const comparison = await compareWithExpectation(testImageBase64, "A red sphere in the center")
        console.log("✅ Matches:", comparison.matches)
        console.log("   Expected:", comparison.expected)
        console.log("   Observed:", comparison.observed)
        console.log("   Differences:", comparison.differences.join(", ") || "(none)")
    } catch (error) {
        console.log("❌ Error:", error instanceof Error ? error.message : error)
    }

    // Test 4: Validate Scene Elements
    console.log("\n📋 Test 4: validateSceneElements()")
    console.log("-".repeat(40))
    try {
        const validation = await validateSceneElements(testImageBase64, ["cube", "sphere", "light"])
        console.log("✅ All Present:", validation.allPresent)
        console.log("   Found:", validation.found.join(", ") || "(none)")
        console.log("   Missing:", validation.missing.join(", ") || "(none)")
    } catch (error) {
        console.log("❌ Error:", error instanceof Error ? error.message : error)
    }

    console.log("\n" + "=".repeat(50))
    console.log("✨ Vision tests complete!\n")
}

main().catch(console.error)
