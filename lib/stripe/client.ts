import 'server-only'

import Stripe from 'stripe'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
}

// Lazy singleton — throws at call time, not module initialization,
// so the build succeeds without STRIPE_SECRET_KEY in CI.
let _stripe: Stripe | undefined

export function getStripeClient(): Stripe {
  _stripe ??= getStripe()
  return _stripe
}

// Named export for convenience — still lazy under the hood
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripeClient()[prop as keyof Stripe]
  },
})
