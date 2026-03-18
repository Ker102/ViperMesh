/**
 * Purge object-specific generator scripts from the vector database.
 * 
 * These scripts (sword_generator, chair_generator, axe_generator, etc.)
 * were confusing the RAG pipeline by being returned as top matches
 * for unrelated prompts. The DB stores embeddings that persist even
 * after file deletion.
 *
 * Usage: npx tsx scripts/purge-object-generators.ts
 */

import { PrismaClient } from "@prisma/client"

async function main() {
  const prisma = new PrismaClient()

  // Object-specific generators that should be removed from the vector DB
  const generatorTitles = [
    "Low Poly Sword Generator",
    "Chair Generator",
    "Axe Generator",
    "Shield Generator",
    "Bow and Arrow Generator",
    "Staff and Wand Generator",
    "Key Generator",
    "Helmet Generator",
    "Torch Generator",
    "Banner Generator",
    "Barrel Generator",
    "Book Generator",
    "Bottle Generator",
    "Candle Generator",
    "Chest Generator",
    "Coin Generator",
    "Crate Generator",
    "Door Generator",
    "Fence Generator",
    "Food Generator",
    "Gem Generator",
    "Ladder Generator",
    "Lamp Generator",
    "Lantern Generator",
    "Potion Generator",
    "Rock Generator",
    "Scroll Generator",
    "Shelf Generator",
    "Stairs Generator",
    "Table Generator",
    "Window Generator",
  ]

  console.log("Searching for object-specific generator embeddings...")

  // Find and delete documents that match generator titles in metadata
  const result = await prisma.$executeRaw`
    DELETE FROM document_embeddings
    WHERE metadata::text LIKE ANY (ARRAY[
      '%Sword Generator%',
      '%Chair Generator%',
      '%Axe Generator%',
      '%Shield Generator%',
      '%Bow and Arrow%',
      '%Staff and Wand%',
      '%Key Generator%',
      '%Helmet Generator%',
      '%Torch Generator%',
      '%Banner Generator%',
      '%Barrel Generator%',
      '%Book Generator%',
      '%Bottle Generator%',
      '%Candle Generator%',
      '%Chest Generator%',
      '%Coin Generator%',
      '%Crate Generator%',
      '%Door Generator%',
      '%Fence Generator%',
      '%Food Generator%',
      '%Gem Generator%',
      '%Ladder Generator%',
      '%Lamp Generator%',
      '%Lantern Generator%',
      '%Potion Generator%',
      '%Rock Generator%',
      '%Scroll Generator%',
      '%Shelf Generator%',
      '%Stairs Generator%',
      '%Table Generator%',
      '%Window Generator%'
    ])
  `

  console.log(`Deleted ${result} generator embeddings from vector DB`)

  // Check remaining document count
  const remaining = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM document_embeddings
    WHERE source = 'blender-scripts'
  `

  console.log(`Remaining blender-scripts in DB: ${remaining[0].count}`)

  await prisma.$disconnect()
}

main().catch(console.error)
