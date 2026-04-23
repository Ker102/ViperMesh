import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { STRIPE_ENABLED, stripe } from "@/lib/stripe"

/**
 * Session shape returned by auth() — matches the interface previously
 * provided by NextAuth so every consumer keeps working without changes.
 */
export interface SessionUser {
  id: string
  email: string
  name: string | null
  image: string | null
  subscriptionTier: string
  subscriptionStatus: string | null
  stripeCustomerId?: string
  localLlmProvider?: string | null
  localLlmUrl?: string | null
  localLlmModel?: string | null
  localLlmApiKey?: string | null
}

export interface Session {
  user: SessionUser
}

/**
 * Ensure the Prisma user has a linked Stripe customer. Called on every
 * auth() invocation (idempotent — skips if already linked).
 */
async function ensureStripeCustomer(userId: string) {
  if (!STRIPE_ENABLED || !stripe) {
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  })

  if (!user?.email) {
    return
  }

  // Update metadata if already linked
  if (user.stripeCustomerId) {
    try {
      await stripe.customers.update(user.stripeCustomerId, {
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId },
      })
    } catch (error) {
      console.error("Stripe customer update failed:", error)
    }
    return
  }

  let resolvedCustomerId: string | null = null

  try {
    const existing = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })
    if (existing.data.length > 0) {
      resolvedCustomerId = existing.data[0].id
    }
  } catch (error) {
    console.error("Stripe customer lookup failed:", error)
  }

  if (resolvedCustomerId) {
    const conflictingUser = await prisma.user.findFirst({
      where: {
        stripeCustomerId: resolvedCustomerId,
        NOT: { id: userId },
      },
      select: { id: true },
    })

    if (conflictingUser) {
      console.warn(
        `Stripe customer ${resolvedCustomerId} already associated with user ${conflictingUser.id}; skipping relink for ${userId}`
      )
      return
    }

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: resolvedCustomerId },
    })

    try {
      await stripe.customers.update(resolvedCustomerId, {
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId },
      })
    } catch (error) {
      console.error("Stripe customer metadata sync failed:", error)
    }

    return
  }

  try {
    const created = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    })

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: created.id },
    })
  } catch (error) {
    console.error("Stripe customer creation failed:", error)
  }
}

/**
 * Get the authenticated session via Supabase, then enrich it with
 * Prisma user data. Returns `null` when not authenticated.
 *
 * This is a drop-in replacement for NextAuth's `auth()`.
 */
export async function auth(): Promise<Session | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()

    if (!supabaseUser || !supabaseUser.email) {
      return null
    }

    // Find or create the Prisma user record linked to this Supabase user
    let dbUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    })

    if (!dbUser) {
      // Auto-provision a Prisma user on first Supabase login
      dbUser = await prisma.user.create({
        data: {
          email: supabaseUser.email,
          name:
            supabaseUser.user_metadata?.name ??
            supabaseUser.user_metadata?.full_name ??
            null,
          image: supabaseUser.user_metadata?.avatar_url ?? null,
          subscriptionTier: "free",
        },
      })
    }

    // Ensure Stripe customer exists (idempotent)
    if (STRIPE_ENABLED) {
      ensureStripeCustomer(dbUser.id).catch((err) =>
        console.error("Background Stripe sync failed:", err)
      )
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
        subscriptionTier: dbUser.subscriptionTier,
        subscriptionStatus: dbUser.subscriptionStatus,
        stripeCustomerId: dbUser.stripeCustomerId ?? undefined,
        localLlmProvider: dbUser.localLlmProvider,
        localLlmUrl: dbUser.localLlmUrl,
        localLlmModel: dbUser.localLlmModel,
        localLlmApiKey: dbUser.localLlmApiKey,
      },
    }
  } catch (error) {
    console.error("auth() error:", error)
    return null
  }
}
