/**
 * Cookie that carries a referral code from landing/signup URLs through
 * the auth flow. Lasts 30 days — long enough for a typical trial-to-paid
 * journey but short enough that abandoned flows clear up.
 */
export const REFERRAL_COOKIE = 'clipflow.ref_code'
export const REFERRAL_SOURCE_COOKIE = 'clipflow.ref_source'
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Stripe coupon that grants both sides their 20 % off. Created once in the
 * Stripe dashboard (or via CLI) with `duration: forever`, percent_off: 20.
 */
export function getReferralCouponId(): string {
  return process.env.STRIPE_REFERRAL_COUPON_ID ?? ''
}

/**
 * The percent discount represented by the coupon. Hard-coded so the UI
 * can advertise it without a round-trip to Stripe. Keep in sync with the
 * actual coupon if you change it.
 */
export const REFERRAL_DISCOUNT_PERCENT = 20
