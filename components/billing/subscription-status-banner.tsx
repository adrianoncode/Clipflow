import Link from 'next/link'
import { AlertTriangle, XCircle } from 'lucide-react'

import { getSubscription } from '@/lib/billing/get-subscription'

/**
 * Top-of-app banner that warns users when their subscription is in a
 * non-happy state. Three branches:
 *
 *   past_due    → card failed, subscription still active but at risk.
 *                 Link to billing portal to update card.
 *   unpaid      → enough retries failed that Stripe stopped retrying.
 *                 Hard warning: features may be locked.
 *   canceled or → subscription is ending (cancel_at_period_end)
 *   cancel_at     or already ended. Tell the user the cut-off date.
 *
 * Rendered by the app shell on every page — cheap to compute (one
 * DB read) and worth the real estate because users who ignore a
 * past_due card don't come back once their subscription auto-cancels.
 */
export async function SubscriptionStatusBanner({
  workspaceId,
}: {
  workspaceId: string
}) {
  const sub = await getSubscription(workspaceId)

  if (!sub || sub.plan === 'free') return null

  // past_due: Stripe failed to charge but is still retrying.
  if (sub.status === 'past_due') {
    return (
      <Banner tone="warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-semibold">Payment failed.</span>{' '}
          <span className="text-amber-900/80">
            We couldn&apos;t charge your card. Update your payment method before the
            next retry to avoid losing access.
          </span>
        </div>
        <Link
          href={`/billing?workspace_id=${workspaceId}`}
          className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-amber-50 transition-colors hover:bg-amber-950"
        >
          Update payment
        </Link>
      </Banner>
    )
  }

  // unpaid / incomplete_expired: retries exhausted. Hard tone.
  if (sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
    return (
      <Banner tone="danger">
        <XCircle className="h-4 w-4 shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-semibold">Subscription suspended.</span>{' '}
          <span className="text-red-900/80">
            Stripe stopped retrying and some features are locked. Reactivate by
            updating your payment method.
          </span>
        </div>
        <Link
          href={`/billing?workspace_id=${workspaceId}`}
          className="shrink-0 rounded-lg bg-red-900 px-3 py-1.5 text-xs font-bold text-red-50 transition-colors hover:bg-red-950"
        >
          Reactivate
        </Link>
      </Banner>
    )
  }

  // Scheduled to cancel at period end — not blocking yet, informational.
  if (sub.cancel_at_period_end && sub.status === 'active') {
    const cancelDate = sub.current_period_end
      ? new Date(sub.current_period_end).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null
    return (
      <Banner tone="info">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground/70" />
        <div className="flex-1 text-sm text-muted-foreground">
          Your subscription ends on{' '}
          <span className="font-semibold text-foreground">{cancelDate ?? 'the next billing date'}</span>.
          Resubscribe to keep features past that date.
        </div>
        <Link
          href={`/billing?workspace_id=${workspaceId}`}
          className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
        >
          Manage
        </Link>
      </Banner>
    )
  }

  return null
}

function Banner({
  tone,
  children,
}: {
  tone: 'warning' | 'danger' | 'info'
  children: React.ReactNode
}) {
  const palette =
    tone === 'danger'
      ? 'border-red-300/70 bg-red-50 text-red-900'
      : tone === 'warning'
        ? 'border-amber-300/70 bg-amber-50 text-amber-900'
        : 'border-border/60 bg-muted/40 text-foreground'
  return (
    <div
      role="status"
      className={`flex items-center gap-3 border-b px-4 py-2.5 sm:px-6 ${palette}`}
    >
      {children}
    </div>
  )
}
