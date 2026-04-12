/**
 * Stripe Price IDs — set these as environment variables.
 * Create products + prices in the Stripe dashboard, then copy the price IDs here.
 *
 * Monthly prices:
 *   STRIPE_PRICE_SOLO_MONTHLY   = price_xxx
 *   STRIPE_PRICE_TEAM_MONTHLY   = price_xxx
 *   STRIPE_PRICE_AGENCY_MONTHLY = price_xxx
 *
 * Annual prices (billed as single charge):
 *   STRIPE_PRICE_SOLO_ANNUAL    = price_xxx
 *   STRIPE_PRICE_TEAM_ANNUAL    = price_xxx
 *   STRIPE_PRICE_AGENCY_ANNUAL  = price_xxx
 */
export const PRICE_IDS = {
  solo: {
    monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY ?? '',
    annual: process.env.STRIPE_PRICE_SOLO_ANNUAL ?? '',
  },
  team: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? '',
    annual: process.env.STRIPE_PRICE_TEAM_ANNUAL ?? '',
  },
  agency: {
    monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? '',
    annual: process.env.STRIPE_PRICE_AGENCY_ANNUAL ?? '',
  },
} as const
