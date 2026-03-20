import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env") })

const prisma = new PrismaClient()

async function main() {
  // Find the most recent assistant messages with tool call metadata
  const msgs = await prisma.message.findMany({
    where: { role: "assistant" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, createdAt: true, metadata: true },
  })

  for (const m of msgs) {
    console.log("\n=== Message", m.id, "at", m.createdAt, "===")
    const meta = m.metadata as Record<string, unknown> | null
    if (meta?.executedCommands && Array.isArray(meta.executedCommands)) {
      for (const cmd of meta.executedCommands) {
        const c = cmd as { tool: string; arguments?: Record<string, unknown>; description?: string }
        console.log(`  🔧 ${c.tool}`)
        console.log(`     Args: ${JSON.stringify(c.arguments ?? {}, null, 4)}`)
      }
    } else {
      console.log("  (no executedCommands)")
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)
