/**
 * Tool Guide Ingestion Script
 *
 * Reads markdown guide files from data/tool-guides/, generates embeddings
 * using the app's Gemini embedding pipeline, and upserts them into the
 * document_embeddings table with source = "tool-guides".
 *
 * Usage: npx tsx scripts/ingestion/ingest-tool-guides.ts [--force]
 *
 * Options:
 *   --force   Delete existing tool-guide documents before re-ingesting
 */

import { readFileSync, readdirSync } from "fs"
import path from "path"

// Load .env before any module that reads process.env
import dotenv from "dotenv"
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

import { addDocuments, deleteBySource, getDocumentCount } from "../../lib/ai/vectorstore"

const GUIDES_DIR = path.join(process.cwd(), "data", "tool-guides")
const SOURCE_TAG = "tool-guides"

interface GuideMetadata {
  title: string
  category: string
  tags: string[]
  triggered_by: string[]
  description: string
  blender_version: string
}

/**
 * Parse YAML-ish frontmatter from a markdown file.
 * Handles both scalar and array fields.
 */
function parseFrontmatter(content: string): { metadata: Partial<GuideMetadata>; body: string } {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/m)
  if (!fmMatch) {
    return { metadata: {}, body: content }
  }

  const rawYaml = fmMatch[1]
  const body = fmMatch[2]
  const metadata: Record<string, unknown> = {}

  for (const line of rawYaml.split(/\r?\n/)) {
    const match = line.match(/^(\w+):\s*(.*)$/)
    if (!match) continue

    const [, key, value] = match
    const trimmed = value.trim()

    // Handle JSON-style arrays: ["a", "b", "c"]
    if (trimmed.startsWith("[")) {
      try {
        metadata[key] = JSON.parse(trimmed)
      } catch {
        metadata[key] = trimmed
      }
    }
    // Handle quoted strings
    else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      metadata[key] = trimmed.slice(1, -1)
    }
    // Plain value
    else {
      metadata[key] = trimmed
    }
  }

  return { metadata: metadata as Partial<GuideMetadata>, body }
}

async function main() {
  const forceFlag = process.argv.includes("--force")

  console.log(`\n🚀 Tool Guide Ingestion`)
  console.log(`   Source directory: ${GUIDES_DIR}`)
  console.log(`   Source tag: ${SOURCE_TAG}`)
  console.log(`   Force mode: ${forceFlag ? "YES (will delete existing)" : "no"}\n`)

  // Find all .md files in the guides directory
  const files = readdirSync(GUIDES_DIR).filter((f) => f.endsWith(".md"))
  console.log(`📂 Found ${files.length} guide files:\n`)

  if (files.length === 0) {
    console.log("🛑 No guide files found. Aborting.")
    process.exit(1)
  }

  // If --force, delete existing tool-guide documents first
  if (forceFlag) {
    const existingCount = await getDocumentCount(SOURCE_TAG)
    if (existingCount > 0) {
      console.log(`🗑️  Deleting ${existingCount} existing tool-guide documents...`)
      await deleteBySource(SOURCE_TAG)
      console.log(`   ✅ Deleted.\n`)
    }
  } else {
    const existingCount = await getDocumentCount(SOURCE_TAG)
    if (existingCount > 0) {
      console.error(`⚠️  Found ${existingCount} existing tool-guide documents.`)
      console.error(`   Re-run with --force to delete and re-ingest.`)
      process.exit(1)
    }
  }

  // Parse all guide files
  const documents: Array<{
    content: string
    metadata: Record<string, unknown>
    source: string
  }> = []

  for (const file of files) {
    const filePath = path.join(GUIDES_DIR, file)
    const raw = readFileSync(filePath, "utf-8")
    const { metadata, body } = parseFrontmatter(raw)

    console.log(`   📄 ${file}`)
    console.log(`      Title: ${metadata.title ?? "Untitled"}`)
    console.log(`      Category: ${metadata.category ?? "unknown"}`)
    console.log(`      Triggers: ${(metadata.triggered_by ?? []).join(", ")}`)
    console.log(`      Tags: ${(metadata.tags ?? []).length} tags`)
    console.log()

    documents.push({
      // Embed the full content (frontmatter + body) for maximum semantic coverage
      content: body.trim(),
      metadata: {
        filename: file,
        type: "guide",           // Distinguishes from code scripts
        title: metadata.title,
        category: metadata.category,
        tags: metadata.tags ?? [],
        triggered_by: metadata.triggered_by ?? [],
        description: metadata.description,
        blender_version: metadata.blender_version,
      },
      source: SOURCE_TAG,
    })
  }

  // Generate embeddings and insert into vectorstore
  console.log(`\n📤 Generating embeddings for ${documents.length} guides...`)
  console.log(`   Model: gemini-embedding-001 (768 dimensions)`)

  try {
    const ids = await addDocuments(documents)
    console.log(`\n✅ Successfully ingested ${ids.length} guides into vectorstore.`)

    // Verify count
    const finalCount = await getDocumentCount(SOURCE_TAG)
    console.log(`📊 Total tool-guide documents in vectorstore: ${finalCount}`)
  } catch (error) {
    console.error(`\n❌ Ingestion failed:`, error)
    process.exit(1)
  }

  console.log(`\n🎉 Done! The RAG middleware will now surface these guides automatically.`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
