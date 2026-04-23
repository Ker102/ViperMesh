import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() || ''
const looksLikePlaceholder =
  stripeSecretKey.length === 0 ||
  stripeSecretKey === 'sk_test_placeholder' ||
  stripeSecretKey.includes('placeholder')

export const STRIPE_ENABLED = !looksLikePlaceholder

export const stripe = STRIPE_ENABLED
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  : null

export const PRICING_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      '5 orchestrated requests per day',
      '1 active project slot',
      'Local LLM (Ollama / LM Studio)',
      'Manual MCP command toggles'
    ],
    limits: {
      maxProjects: 1,
      dailyRequests: 5,
      modelAccess: 'gemini-3.1-pro-preview'
    }
  },
  STARTER: {
    name: 'Starter',
    priceMonthly: 12,
    priceYearly: 99,
    stripePriceIds: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
    },
    features: [
      '500 AI requests per month',
      '10 active projects',
      'Hyper3D & Sketchfab integration',
      'Firecrawl web research access',
      'Viewport context summaries',
      'Email support',
      'Export project history'
    ],
    limits: {
      maxProjects: 10,
      monthlyRequests: 500,
      modelAccess: 'gemini-pro'
    }
  },
  PRO: {
    name: 'Pro',
    priceMonthly: 29,
    priceYearly: 249,
    stripePriceIds: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    },
    features: [
      'Unlimited AI requests',
      'Unlimited projects',
      'Priority orchestration queueing',
      'Advanced viewport & audit reports',
      'Automated asset QA + Firecrawl',
      'Priority support with SLA',
      'API access & webhooks',
      'Team collaboration (coming soon)'
    ],
    limits: {
      maxProjects: -1,
      monthlyRequests: -1,
      modelAccess: 'gemini-ultra'
    }
  }
} as const

export type SubscriptionTier = keyof typeof PRICING_TIERS
