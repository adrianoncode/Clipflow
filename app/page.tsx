import type { Metadata } from 'next'

import { NewLanding } from '@/components/landing/new-landing'
import { normalizeReferralCode } from '@/lib/referrals/normalize-code'
import { lookupReferrerUserId } from '@/lib/referrals/lookup-referrer'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

export const metadata: Metadata = {
  title: 'Clipflow — One recording. A month of posts.',
  description:
    'Drop in a podcast, Zoom recording, or 40-minute rant. Clipflow pulls out the sharpest clips, writes the captions, and schedules them across every channel you own.',
  alternates: { canonical: 'https://clipflow.to' },
}

interface HomePageProps {
  searchParams: { ref?: string; source?: string }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const refCode = normalizeReferralCode(searchParams.ref)
  const hasValidRef = refCode ? Boolean(await lookupReferrerUserId(refCode)) : false
  const signupHref = hasValidRef
    ? `/signup?ref=${refCode}${searchParams.source ? `&source=${encodeURIComponent(searchParams.source)}` : ''}`
    : '/signup'

  return (
    <NewLanding
      signupHref={signupHref}
      hasValidRef={hasValidRef}
      referralPercent={REFERRAL_DISCOUNT_PERCENT}
    />
  )
}
