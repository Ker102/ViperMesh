/**
 * Prisma Seed Script
 * 
 * Runs automatically after `prisma migrate dev` and `prisma migrate reset`.
 * Seeds essential data that must always exist (subscription plans, etc).
 * 
 * Usage: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Subscription Plans (upsert to be idempotent)
  const plans = [
    {
      id: "free",
      name: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      features: { localLlm: true, cloudLlm: false, maxProjects: 2, maxRequests: 50 },
      maxProjects: 2,
      maxMonthlyRequests: 50,
    },
    {
      id: "starter",
      name: "Starter",
      priceMonthly: 9.99,
      priceYearly: 99.99,
      features: { localLlm: true, cloudLlm: true, maxProjects: 10, maxRequests: 500 },
      maxProjects: 10,
      maxMonthlyRequests: 500,
    },
    {
      id: "pro",
      name: "Pro",
      priceMonthly: 29.99,
      priceYearly: 299.99,
      features: { localLlm: true, cloudLlm: true, maxProjects: -1, maxRequests: -1, prioritySupport: true },
      maxProjects: -1,
      maxMonthlyRequests: -1,
    },
  ]

  for (const plan of plans) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO subscription_plans (id, name, "priceMonthly", "priceYearly", features, "maxProjects", "maxMonthlyRequests")
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         "priceMonthly" = EXCLUDED."priceMonthly",
         "priceYearly" = EXCLUDED."priceYearly",
         features = EXCLUDED.features,
         "maxProjects" = EXCLUDED."maxProjects",
         "maxMonthlyRequests" = EXCLUDED."maxMonthlyRequests"`,
      plan.id,
      plan.name,
      plan.priceMonthly,
      plan.priceYearly,
      JSON.stringify(plan.features),
      plan.maxProjects,
      plan.maxMonthlyRequests,
    )
    console.log(`  ✓ Plan: ${plan.id} (${plan.name})`)
  }

  console.log("✅ Seed complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
