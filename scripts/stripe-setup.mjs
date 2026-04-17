/**
 * One-time Stripe setup script for Clipflow.
 *
 * Creates:
 *   - 3 products: Solo, Team, Agency
 *   - 6 prices: monthly + annual for each
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/stripe-setup.mjs
 *
 * Or for test mode:
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/stripe-setup.mjs
 *
 * Outputs all price IDs at the end — copy them into Vercel env vars.
 */

import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('❌  Set STRIPE_SECRET_KEY before running this script.')
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
const isLive = key.startsWith('sk_live_')
console.log(`\n🔑  Using ${isLive ? 'LIVE' : 'TEST'} key\n`)

const PLANS = [
  {
    id: 'solo',
    name: 'Clipflow Solo',
    description: 'For individual creators',
    monthly: { amount: 1900, nickname: 'Solo Monthly' },
    annual:  { amount: 15 * 12 * 100, nickname: 'Solo Annual' }, // $180/yr = $15/mo
  },
  {
    id: 'team',
    name: 'Clipflow Team',
    description: 'For agencies and content teams',
    monthly: { amount: 4900, nickname: 'Team Monthly' },
    annual:  { amount: 39 * 12 * 100, nickname: 'Team Annual' }, // $468/yr = $39/mo
  },
  {
    id: 'agency',
    name: 'Clipflow Agency',
    description: 'Unlimited everything',
    monthly: { amount: 9900, nickname: 'Agency Monthly' },
    annual:  { amount: 79 * 12 * 100, nickname: 'Agency Annual' }, // $948/yr = $79/mo
  },
]

const envLines = []

for (const plan of PLANS) {
  console.log(`Creating product: ${plan.name}`)

  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { clipflow_plan: plan.id },
  })

  // Monthly price
  const monthly = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.monthly.amount,
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: plan.monthly.nickname,
    metadata: { clipflow_plan: plan.id, interval: 'monthly' },
  })
  console.log(`  ✅  ${plan.monthly.nickname}: ${monthly.id}`)

  // Annual price — billed as one charge per year
  const annual = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.annual.amount,
    currency: 'usd',
    recurring: { interval: 'year' },
    nickname: plan.annual.nickname,
    metadata: { clipflow_plan: plan.id, interval: 'annual' },
  })
  console.log(`  ✅  ${plan.annual.nickname}: ${annual.id}`)

  const envKey = plan.id.toUpperCase()
  envLines.push(`STRIPE_PRICE_${envKey}_MONTHLY=${monthly.id}`)
  envLines.push(`STRIPE_PRICE_${envKey}_ANNUAL=${annual.id}`)
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('Add these to Vercel → Settings → Environment Variables:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
for (const line of envLines) {
  console.log(line)
}
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('\nNext steps:')
console.log('1. Copy the lines above into Vercel env vars')
console.log('2. In Stripe Dashboard → Developers → Webhooks:')
console.log('   Add endpoint: https://clipflow.to/api/stripe/webhook')
console.log('   Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted')
console.log('   Copy the "Signing secret" → add to Vercel as STRIPE_WEBHOOK_SECRET')
console.log('3. Add your STRIPE_SECRET_KEY to Vercel env vars')
console.log('4. Redeploy in Vercel\n')
