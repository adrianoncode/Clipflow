import { Gift, CheckCircle2 } from 'lucide-react'

import type { ActiveDiscount } from '@/lib/billing/get-active-discount'

interface ActiveDiscountBannerProps {
  discount: ActiveDiscount
  /** Monthly price of the current plan in cents — used to show $X saved. */
  baseMonthlyCents?: number
}

/**
 * Renders the currently-applied Stripe discount so the user has a clear
 * "yes, it worked" signal right on the billing page. Copy changes when
 * the coupon is our referral coupon vs. a generic one.
 */
export function ActiveDiscountBanner({ discount, baseMonthlyCents }: ActiveDiscountBannerProps) {
  const { percentOff, amountOffCents, isReferral } = discount

  let savingsLine = ''
  if (percentOff != null && baseMonthlyCents) {
    const savedCents = Math.round((baseMonthlyCents * percentOff) / 100)
    savingsLine = `Saving $${(savedCents / 100).toFixed(2)}/mo`
  } else if (percentOff != null) {
    savingsLine = `${percentOff}% off`
  } else if (amountOffCents != null) {
    savingsLine = `$${(amountOffCents / 100).toFixed(2)} off`
  }

  const title = isReferral
    ? `Referral discount active · ${percentOff ?? 0}% off`
    : `Discount active · ${percentOff ?? 0}% off`

  const subtitle = isReferral
    ? `${savingsLine} — thanks for spreading the word. Keep sharing to compound.`
    : savingsLine

  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {isReferral ? <Gift className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  )
}
