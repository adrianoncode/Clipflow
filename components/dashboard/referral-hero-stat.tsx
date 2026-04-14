import Link from 'next/link'
import { Gift, ArrowRight } from 'lucide-react'

import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

interface ReferralHeroStatProps {
  confirmedCount: number
  pendingCount: number
  currentPlan: 'free' | 'solo' | 'team' | 'agency'
  monthlyBaseCents: number
}

/**
 * Celebratory achievement banner that shows up on the dashboard once a
 * user has referred at least one paying customer. Serves two goals:
 *   (1) positive feedback — "your hustle paid off"
 *   (2) pull them back to share more (compound savings)
 *
 * Only renders when there's something worth showing.
 */
export function ReferralHeroStat({
  confirmedCount,
  pendingCount,
  currentPlan,
  monthlyBaseCents,
}: ReferralHeroStatProps) {
  if (confirmedCount === 0) return null

  const isFree = currentPlan === 'free'
  const savedCents = isFree ? 0 : Math.round((monthlyBaseCents * REFERRAL_DISCOUNT_PERCENT) / 100)
  const savedMonthly = `$${(savedCents / 100).toFixed(2)}/mo`

  const titleText = isFree
    ? `${confirmedCount} referral${confirmedCount === 1 ? '' : 's'} waiting for you`
    : `Saving ${savedMonthly} thanks to your referrals`

  const subtitleText = isFree
    ? `Your ${REFERRAL_DISCOUNT_PERCENT}% coupon activates automatically when you upgrade.`
    : `${confirmedCount} paid conversion${confirmedCount === 1 ? '' : 's'}${
        pendingCount > 0 ? ` · ${pendingCount} still on free` : ''
      } · keep sharing for compounding discount`

  return (
    <Link
      href={isFree ? '/billing' : '/settings/referrals'}
      className="group flex items-center gap-4 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Gift className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{titleText}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitleText}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}
