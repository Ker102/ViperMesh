import dotenv from 'dotenv'
import { similaritySearch } from '../lib/ai/vectorstore'

dotenv.config()

async function testRAG() {
    console.log("🔍 Testing RAG Retrieval...")

    const queries = [
        "How to create a glass material?",
        "Add a subdivision modifier to an object",
        "Create 3D text saying Hello",
        "Select all objects in the scene",
        "Remove unused materials and textures",
        "Create a bezier curve circle",
        "Rotate an object 45 degrees on Z axis"
    ]

    for (const query of queries) {
        console.log(`\nQuery: "${query}"`)
        try {
            const results = await similaritySearch(query, { limit: 2, minSimilarity: 0.3 })
            console.log(`Found ${results.length} matching documents:`)

            results.forEach((res, i) => {
                console.log(`${i + 1}. [${res.similarity.toFixed(4)}] ${res.metadata?.title || 'No Title'}`)
                // console.log(`   Content snippet: ${res.content.substring(0, 100)}...`)
            })
        } catch (error: unknown) {
            console.error(`❌ Search failed for "${query}":`, error instanceof Error ? error.message : error)
        }
    }
}

testRAG().catch(console.error)
