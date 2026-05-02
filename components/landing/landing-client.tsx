'use client'

import { useSearchParams } from 'next/navigation'

import { SmoothScroll } from './smooth-scroll'
import { NewLanding } from './new-landing'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'
import { normalizeReferralCode } from '@/lib/referrals/normalize-code'

/**
 * Reads `?ref=` (and `?source=`) on the client so the landing page itself
 * stays statically prerendered. The DB-side check that used to run on
 * every SSR render forced `/` to be dynamic — page render moved off the
 * CDN edge for the 99% of visits with no ref. We now show the badge
 * optimistically when the ref is syntactically valid; the signup page
 * still validates the code against the `profiles` table before applying
 * the discount, so an invalid ref is caught at the only step where it
 * can actually mint a coupon.
 */
export function LandingClient() {
  const params = useSearchParams()
  const refCode = normalizeReferralCode(params.get('ref'))
  const source = params.get('source')
  const hasValidRef = refCode !== null
  const signupHref = refCode
    ? `/signup?ref=${refCode}${source ? `&source=${encodeURIComponent(source)}` : ''}`
    : '/signup'

  return (
    <>
      <SmoothScroll />
      <NewLanding
        signupHref={signupHref}
        hasValidRef={hasValidRef}
        referralPercent={REFERRAL_DISCOUNT_PERCENT}
      />
    </>
  )
}
