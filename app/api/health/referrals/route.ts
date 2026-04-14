import { NextResponse } from 'next/server'

import { stripe } from '@/lib/stripe/client'
import { getReferralCouponId, REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

export const dynamic = 'force-dynamic'

/**
 * Readiness probe for the referral system. Confirms:
 *   - STRIPE_REFERRAL_COUPON_ID is set
 *   - the coupon actually exists in Stripe
 *   - it's not deleted, and its percent_off matches our advertised rate
 *
 * Hit it after deploys or coupon rotations to fail fast on misconfiguration.
 * Kept on a non-guessable, un-indexed URL; no secrets are returned.
 *
 *   GET /api/health/referrals
 *   → 200 { ok: true, coupon: { id, percent_off, duration, valid } }
 *   → 500 { ok: false, error: "…" }
 */
export async function GET() {
  const couponId = getReferralCouponId()
  if (!couponId) {
    return NextResponse.json(
      { ok: false, error: 'STRIPE_REFERRAL_COUPON_ID is not set' },
      { status: 500 },
    )
  }

  try {
    const coupon = await stripe.coupons.retrieve(couponId)

    const issues: string[] = []
    if (coupon.deleted) issues.push('coupon is marked deleted in Stripe')
    if (coupon.valid === false) issues.push('coupon is no longer valid (expired or fully redeemed)')
    if (coupon.duration !== 'forever') {
      issues.push(`coupon duration is "${coupon.duration}", expected "forever"`)
    }
    if (coupon.percent_off !== REFERRAL_DISCOUNT_PERCENT) {
      issues.push(
        `coupon percent_off is ${coupon.percent_off}, advertised rate is ${REFERRAL_DISCOUNT_PERCENT}`,
      )
    }

    if (issues.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: issues.join('; '),
          coupon: {
            id: coupon.id,
            percent_off: coupon.percent_off,
            duration: coupon.duration,
            valid: coupon.valid,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      coupon: {
        id: coupon.id,
        percent_off: coupon.percent_off,
        duration: coupon.duration,
        valid: coupon.valid,
      },
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error retrieving coupon from Stripe'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
