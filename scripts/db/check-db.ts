import { prisma } from "../lib/db"

async function checkExtensions() {
    try {
        const extensions = await prisma.$queryRaw<any[]>`SELECT extname FROM pg_extension`
        console.log("Database extensions:", extensions.map(e => e.extname))

        const hasVector = extensions.some(e => e.extname === 'vector')
        if (hasVector) {
            console.log("✅ pgvector extension is ENABLED.")
        } else {
            console.log("❌ pgvector extension is NOT ENABLED.")
        }
    } catch (error: unknown) {
        console.error("❌ Error checking extensions:", error instanceof Error ? error.message : error)
    } finally {
        await prisma.$disconnect()
    }
}

checkExtensions()
