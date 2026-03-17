/**
 * Re-ingest Blender Scripts using Gemini Embeddings
 *
 * The original ingest-blender-scripts.py used the deprecated Together.ai model.
 * This script re-ingests all Python scripts from data/blender-scripts/ using
 * the current Gemini gemini-embedding-001 model (768 dimensions) so they're
 * compatible with the RAG middleware's similarity search.
 *
 * Usage: npx tsx scripts/ingestion/reingest-blender-scripts.ts [--force]
 *
 * Options:
 *   --force   Delete existing blender-script documents before re-ingesting
 */

import { readFileSync, readdirSync, statSync } from "fs"
import path from "path"

import dotenv from "dotenv"
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

import { addDocuments, deleteBySource, getDocumentCount } from "../../lib/ai/vectorstore"

const SCRIPTS_DIR = path.join(process.cwd(), "data", "blender-scripts")
const SOURCE_TAG = "blender-scripts"

interface ScriptMetadata {
  title?: string
  category?: string
  tags?: string[]
  description?: string
}

/**
 * Recursively find all .py files
 */
function findPythonFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findPythonFiles(fullPath))
    } else if (entry.name.endsWith(".py")) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Extract JSON metadata from the triple-quoted docstring at the start of a file.
 */
function extractMetadata(content: string, filename: string, relPath: string): ScriptMetadata & { filename: string; path: string } {
  const base: ScriptMetadata & { filename: string; path: string } = {
    filename,
    path: relPath,
  }

  const match = content.match(/^"""\s*([\s\S]*?)"""/m)
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim())
      Object.assign(base, parsed)
    } catch {
      // Not valid JSON — skip metadata extraction
    }
  }

  // Derive category from path
  const parts = relPath.split("/")
  if (parts.length > 1) {
    base.category = parts.slice(0, -1).join("/")
  } else {
    base.category = base.category ?? "utility"
  }

  return base
}

async function main() {
  const forceFlag = process.argv.includes("--force")

  console.log(`\n🚀 Blender Script Re-Ingestion (Gemini Embeddings)`)
  console.log(`   Source directory: ${SCRIPTS_DIR}`)
  console.log(`   Source tag: ${SOURCE_TAG}`)
  console.log(`   Force mode: ${forceFlag ? "YES (will delete existing)" : "no"}\n`)

  // Find all Python files
  const files = findPythonFiles(SCRIPTS_DIR)
  console.log(`📂 Found ${files.length} Python files\n`)

  if (files.length === 0) {
    console.log("🛑 No Python files found. Aborting.")
    process.exit(1)
  }

  // Check existing count
  const existingCount = await getDocumentCount(SOURCE_TAG)
  if (existingCount > 0) {
    if (forceFlag) {
      console.log(`🗑️  Deleting ${existingCount} existing blender-script documents...`)
      await deleteBySource(SOURCE_TAG)
      console.log(`   ✅ Deleted.\n`)
    } else {
      console.log(`⚠️  Found ${existingCount} existing blender-script documents.`)
      console.log(`   Use --force to delete and re-ingest.\n`)
      process.exit(0)
    }
  }

  // Prepare documents
  const documents: Array<{
    content: string
    metadata: Record<string, unknown>
    source: string
  }> = []

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8")
    const relPath = path.relative(SCRIPTS_DIR, filePath).replace(/\\/g, "/")
    const metadata = extractMetadata(content, path.basename(filePath), relPath)

    console.log(`   📄 ${relPath} (${metadata.title ?? "Untitled"}) [${metadata.category}]`)

    documents.push({
      content: content.trim(),
      metadata: metadata as unknown as Record<string, unknown>,
      source: SOURCE_TAG,
    })
  }

  // Generate embeddings and insert — batch to avoid overwhelming the API
  console.log(`\n📤 Generating Gemini embeddings for ${documents.length} scripts...`)
  console.log(`   Model: gemini-embedding-001 (768 dimensions)`)
  console.log(`   This may take a minute...\n`)

  const BATCH_SIZE = 10
  let totalInserted = 0

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(documents.length / BATCH_SIZE)

    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} docs)...`)

    try {
      const ids = await addDocuments(batch)
      totalInserted += ids.length
    } catch (error) {
      console.error(`   ❌ Batch ${batchNum} failed:`, error instanceof Error ? error.message : error)
      // Continue with next batch
    }

    // Brief pause between batches for rate limiting
    if (i + BATCH_SIZE < documents.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log(`\n✅ Successfully ingested ${totalInserted}/${documents.length} scripts`)

  // Verify final count
  const finalCount = await getDocumentCount(SOURCE_TAG)
  const guideCount = await getDocumentCount("tool-guides")
  const totalCount = await getDocumentCount()
  console.log(`📊 Vectorstore summary:`)
  console.log(`   blender-scripts: ${finalCount}`)
  console.log(`   tool-guides:     ${guideCount}`)
  console.log(`   total:           ${totalCount}`)
  console.log(`\n🎉 Done!`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
