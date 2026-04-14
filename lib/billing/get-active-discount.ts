import 'server-only'

import { stripe } from '@/lib/stripe/client'

export interface ActiveDiscount {
  percentOff: number | null
  amountOffCents: number | null
  couponId: string
  couponName: string | null
  /** Whether the discount is our referral coupon — informs the banner copy. */
  isReferral: boolean
}

interface LegacyCoupon {
  id: string
  name?: string | null
  percent_off?: number | null
  amount_off?: number | null
}

interface LegacyDiscount {
  coupon?: LegacyCoupon | null
}

/**
 * Resolves the currently-applied discount on a Stripe subscription, if any.
 * Returns null when there's no discount or the subscription is missing.
 *
 * Why server-side: reading the discount requires the Stripe API key, and
 * gives us the authoritative answer (the `subscriptions` table doesn't
 * track discounts — we'd have to mirror them to know).
 *
 * We read the raw response as `unknown` and narrow structurally — the
 * `discount` field vs `discounts` array vary by Stripe API version, so
 * both paths are checked.
 */
export async function getActiveStripeDiscount(
  stripeSubscriptionId: string | null,
): Promise<ActiveDiscount | null> {
  if (!stripeSubscriptionId) return null
  const referralCouponId = process.env.STRIPE_REFERRAL_COUPON_ID ?? ''

  try {
    const sub = (await stripe.subscriptions.retrieve(stripeSubscriptionId, {
      expand: ['discounts'],
    })) as unknown as {
      discounts?: LegacyDiscount[] | string[]
      discount?: LegacyDiscount | string | null
    }

    let coupon: LegacyCoupon | null = null

    if (Array.isArray(sub.discounts) && sub.discounts.length > 0) {
      const first = sub.discounts[0]
      if (first && typeof first === 'object' && 'coupon' in first) {
        coupon = first.coupon ?? null
      }
    } else if (sub.discount && typeof sub.discount === 'object' && 'coupon' in sub.discount) {
      coupon = sub.discount.coupon ?? null
    }

    if (!coupon) return null

    return {
      percentOff: coupon.percent_off ?? null,
      amountOffCents: coupon.amount_off ?? null,
      couponId: coupon.id,
      couponName: coupon.name ?? null,
      isReferral: referralCouponId !== '' && coupon.id === referralCouponId,
    }
  } catch (err) {
    console.error('[getActiveStripeDiscount]', err)
    return null
  }
}
