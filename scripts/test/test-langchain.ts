import { createBlenderAgent } from "../lib/ai/agents.legacy"
import { embedText, EMBEDDING_DIMENSIONS } from "../lib/ai/embeddings"
import { similaritySearch } from "../lib/ai/vectorstore"

async function testAIStack() {
    console.log("🧪 Starting AI Stack Verification...")

    // 1. Test Embeddings (Together.ai)
    console.log("\n1. Testing Together.ai Embeddings...")
    try {
        const text = "ModelForge is an AI-powered Blender assistant."
        const vector = await embedText(text)
        console.log(`✅ Embedding generated successfully. Vector length: ${vector.length}`)
        if (vector.length !== EMBEDDING_DIMENSIONS) {
            console.warn(`⚠️ Warning: Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${vector.length}`)
        }
    } catch (error) {
        console.error("❌ Embedding test failed:", error)
    }

    // 2. Test Vector Store (Neon pgvector)
    console.log("\n2. Testing Neon Vector Store...")
    try {
        const results = await similaritySearch("test query", { limit: 1 })
        console.log(`✅ Vector store search completed. Found ${results.length} results.`)
    } catch (error) {
        console.error("❌ Vector store test failed:", error)
    }

    // 3. Test Agent Planning (LangChain + Gemini)
    console.log("\n3. Testing BlenderAgent Planning...")
    const agent = createBlenderAgent({ useRAG: false })
    try {
        const planResult = await agent.plan("Add a red cube at the center")
        console.log("✅ Plan generated successfully:")
        console.log(`- Steps: ${planResult.steps.length}`)
        console.log(`- First Action: ${planResult.steps[0]?.action}`)
    } catch (error) {
        console.error("❌ Agent planning failed:", error)
    }

    console.log("\n🏁 Verification Complete.")
}

testAIStack().catch(console.error)
