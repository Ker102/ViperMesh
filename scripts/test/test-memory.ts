/**
 * Memory Module Test Script
 * 
 * Tests the ConversationMemory service for storing and retrieving context.
 * Run with: npx tsx scripts/test-memory.ts
 */

import { createConversationMemory } from "../lib/memory"
import { prisma } from "../lib/db"

// Test project ID (use a real one from your database or create a test project)
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || "00000000-0000-0000-0000-000000000000"

async function main() {
    console.log("🧠 ModelForge Memory Module Tests\n")
    console.log("=".repeat(50))
    console.log("Project ID:", TEST_PROJECT_ID)

    // Initialize memory service
    const memory = createConversationMemory(TEST_PROJECT_ID)

    // Test 1: Store Messages
    console.log("\n📋 Test 1: storeMessage()")
    console.log("-".repeat(40))
    try {
        console.log("Storing test messages...")

        const msg1 = await memory.storeMessage("user", "Create a red sports car with shiny metallic paint")
        console.log("✅ Stored user message:", msg1.slice(0, 8) + "...")

        const msg2 = await memory.storeMessage("assistant", "I'll create a sports car with red metallic material. Starting with the body mesh...")
        console.log("✅ Stored assistant message:", msg2.slice(0, 8) + "...")

        const msg3 = await memory.storeMessage("user", "Add chrome wheels and tinted windows")
        console.log("✅ Stored user message:", msg3.slice(0, 8) + "...")
    } catch (error) {
        console.log("❌ Error:", error instanceof Error ? error.message : error)
        console.log("   Note: This test requires a valid project ID and database connection")
        return
    }

    // Test 2: Retrieve Recent Messages
    console.log("\n📋 Test 2: getRecentMessages()")
    console.log("-".repeat(40))
    try {
        const recent = await memory.getRecentMessages(5)
        console.log(`✅ Retrieved ${recent.length} recent messages:`)
        for (const msg of recent) {
            console.log(`   [${msg.role}]: ${msg.content.slice(0, 50)}...`)
        }
    } catch (error) {
        console.log("❌ Error:", error instanceof Error ? error.message : error)
    }

    // Test 3: Semantic Search
    console.log("\n📋 Test 3: retrieveContext() - Semantic Search")
    console.log("-".repeat(40))
    try {
        const query = "car paint and color"
        console.log(`Searching for: "${query}"`)

        const results = await memory.retrieveContext(query, {
            limit: 3,
            minSimilarity: 0.3,
        })

        console.log(`✅ Found ${results.length} relevant messages:`)
        for (const msg of results) {
            console.log(`   [${msg.role}] (${(msg.similarity! * 100).toFixed(1)}% match):`)
            console.log(`      ${msg.content.slice(0, 60)}...`)
        }
    } catch (error) {
        console.log("❌ Error:", error instanceof Error ? error.message : error)
    }

    // Test 4: Format Context for Prompt
    console.log("\n📋 Test 4: formatContextForPrompt()")
    console.log("-".repeat(40))
    try {
        const results = await memory.retrieveContext("wheels", { limit: 2 })
        const formatted = memory.formatContextForPrompt(results)
        console.log("✅ Formatted context:")
        console.log(formatted || "(no relevant context found)")
    } catch (error) {
        console.log("❌ Error:", error instanceof Error ? error.message : error)
    }

    // Cleanup (optional)
    console.log("\n📋 Cleanup")
    console.log("-".repeat(40))
    try {
        await memory.clearConversation()
        console.log("✅ Cleared test conversation")
    } catch (error) {
        console.log("⚠️  Cleanup skipped:", error instanceof Error ? error.message : error)
    }

    console.log("\n" + "=".repeat(50))
    console.log("✨ Memory tests complete!\n")

    await prisma.$disconnect()
}

main().catch(console.error)
