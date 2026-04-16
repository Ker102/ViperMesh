import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { STRIPE_ENABLED, stripe } from "@/lib/stripe"
import { prisma } from "@/lib/db"
import Stripe from "stripe"

export async function POST(req: Request) {
  if (!STRIPE_ENABLED || !stripe) {
    return NextResponse.json(
      { error: "Stripe webhooks are not configured in this environment" },
      { status: 503 }
    )
  }

  const body = await req.text()
  const headerList = await headers()
  const signature = headerList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        
        await prisma.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            subscriptionStatus: subscription.status,
            subscriptionTier: getSubscriptionTier(subscription),
            stripeSubscriptionId: subscription.id,
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        await prisma.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            subscriptionStatus: "canceled",
            subscriptionTier: "free",
            stripeSubscriptionId: null,
          },
        })
        break
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.customer && session.client_reference_id) {
          await prisma.user.update({
            where: { id: session.client_reference_id },
            data: {
              stripeCustomerId: session.customer as string,
            },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

function getSubscriptionTier(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id

  if (!priceId) return "free"

  // Map Stripe price IDs to subscription tiers
  const starterPrices = [
    process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
  ]

  const proPrices = [
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  ]

  if (starterPrices.includes(priceId)) return "starter"
  if (proPrices.includes(priceId)) return "pro"

  return "free"
}
