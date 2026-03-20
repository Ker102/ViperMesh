/**
 * RAG Pipeline Diagnostic
 * Tests vectorstore connectivity, document counts, and similarity search.
 * 
 * Run from project root: npx tsx scripts/ingestion/rag-diagnostic.ts
 */
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env") })

import { getDocumentCount, similaritySearch } from "../../lib/ai/vectorstore"
import { embedText } from "../../lib/ai/embeddings"

async function main() {
  console.log("=== RAG Pipeline Diagnostic ===\n")

  // 1. Check document counts
  console.log("1. Document Counts:")
  try {
    const total = await getDocumentCount()
    const scripts = await getDocumentCount("blender-scripts")
    const guides = await getDocumentCount("tool-guides")
    console.log(`   Total:           ${total}`)
    console.log(`   blender-scripts: ${scripts}`)
    console.log(`   tool-guides:     ${guides}`)

    if (total === 0) {
      console.error("\n❌ VECTORSTORE IS EMPTY! No documents ingested.")
      console.error("   Run: npx tsx scripts/ingestion/reingest-blender-scripts.ts --force")
      process.exit(1)
    }
  } catch (e: unknown) {
    const err = e as Error
    console.error(`   ❌ Failed to query document counts: ${err.message}`)
    console.error(`   Stack: ${err.stack}`)
    process.exit(1)
  }

  // 2. Test embedding generation
  console.log("\n2. Embedding Generation:")
  try {
    const start = Date.now()
    const embedding = await embedText("Add a camera to the scene")
    const elapsed = Date.now() - start
    console.log(`   ✅ Generated ${embedding.length}-dim embedding in ${elapsed}ms`)
  } catch (e: unknown) {
    const err = e as Error
    console.error(`   ❌ Embedding generation failed: ${err.message}`)
    process.exit(1)
  }

  // 3. Test similarity search
  console.log("\n3. Similarity Search (query: 'Add a camera to the scene'):")
  try {
    const results = await similaritySearch("Add a camera to the scene", { limit: 5 })
    console.log(`   Found ${results.length} results:`)
    for (const r of results) {
      console.log(`   - [${r.source}] sim=${r.similarity.toFixed(3)} | ${r.content.slice(0, 100)}...`)
    }

    if (results.length === 0) {
      console.error("\n❌ SEARCH RETURNED 0 RESULTS with default threshold (0.5).")

      // Try with lower threshold
      console.log("\n   Retrying with minSimilarity=0.0:")
      const allResults = await similaritySearch("Add a camera to the scene", {
        limit: 5,
        minSimilarity: 0.0,
      })
      console.log(`   Found ${allResults.length} results with threshold=0.0:`)
      for (const r of allResults) {
        console.log(`   - [${r.source}] sim=${r.similarity.toFixed(3)} | ${r.content.slice(0, 100)}...`)
      }

      if (allResults.length > 0 && allResults[0].similarity < 0.5) {
        console.log("\n⚠️  EMBEDDING MODEL MISMATCH DETECTED!")
        console.log("   Documents exist but similarities are < 0.5")
        console.log("   Solution: Re-ingest documents with current embedding model (Gemini)")
        console.log("   Run: npx tsx scripts/ingestion/reingest-blender-scripts.ts --force")
      }
    }
  } catch (e: unknown) {
    const err = e as Error
    console.error(`   ❌ Similarity search failed: ${err.message}`)
    console.error(`   Stack: ${err.stack}`)
  }

  console.log("\n=== Diagnostic Complete ===")
  process.exit(0)
}

main()
