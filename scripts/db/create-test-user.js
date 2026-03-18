#!/usr/bin/env node

const path = require("path")
const fs = require("fs")
const bcrypt = require("bcryptjs")
const { PrismaClient } = require("@prisma/client")

const envCandidates = [
  process.env.DOTENV_PATH,
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
]

for (const candidate of envCandidates) {
  if (!candidate) continue
  if (fs.existsSync(candidate)) {
    loadEnvFile(candidate)
    break
  }
}

const prisma = new PrismaClient()

const DEFAULT_EMAIL = process.env.TEST_USER_EMAIL || "test@modelforge.dev"
const DEFAULT_PASSWORD = process.env.TEST_USER_PASSWORD || "TestPass123!"
const DEFAULT_NAME = process.env.TEST_USER_NAME || "ModelForge Test"

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required. Set it in your environment or .env/.env.local before running npm run test:user."
    )
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL.toLowerCase() },
    update: {
      password: passwordHash,
      name: DEFAULT_NAME,
      subscriptionTier: "pro",
      subscriptionStatus: "active",
    },
    create: {
      email: DEFAULT_EMAIL.toLowerCase(),
      password: passwordHash,
      name: DEFAULT_NAME,
      subscriptionTier: "pro",
      subscriptionStatus: "active",
    },
  })

  console.log("Test user ready:")
  console.log(`  Email: ${user.email}`)
  console.log(`  Password: ${DEFAULT_PASSWORD}`)
  console.log("  Subscription tier: pro (active)")
}

main()
  .catch((error) => {
    console.error("Failed to create test user:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

function loadEnvFile(filePath) {
  const file = fs.readFileSync(filePath, "utf8")
  file.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith("#")) return
    const index = line.indexOf("=")
    if (index === -1) return
    const key = line.slice(0, index).trim()
    if (!key || process.env[key]) return
    const value = line.slice(index + 1).trim().replace(/^"|"$/g, "")
    process.env[key] = value
  })
}
