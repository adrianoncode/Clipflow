import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'

import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'

// QuotaIndicator — slim, persistently-visible row showing the usage
// metric closest to its plan limit. Replaces "user has to dig through
// /settings/billing to see where they stand" — a Stripe-style
// always-on quota awareness without blasting the dashboard with
// upgrade noise.
//
// Computes "tightest" usage server-side (caller hands in the worst
// quota), so this component stays a dumb renderer. When the workspace
// is on an unlimited plan or has 0% usage, it self-hides — empty
// quota indicators are pure visual noise.

interface QuotaIndicatorProps {
  planName: string
  /** Friendly label for the metric, e.g. "Outputs" or "Imports". */
  metricLabel: string
  /** Used count this month. */
  used: number
  /** Plan limit. -1 means unlimited (component returns null in that case). */
  limit: number
  /** Manage-plan / upgrade route. Only shown when usage ≥50% AND plan isn't max. */
  upgradeHref: string
  /** Whether the workspace is on a paid tier. Free plans show upgrade
   *  earlier (≥50%); paid plans only show it when truly close to cap (≥85%). */
  isPaid: boolean
}

export function QuotaIndicator({
  planName,
  metricLabel,
  used,
  limit,
  upgradeHref,
  isPaid,
}: QuotaIndicatorProps) {
  // Hide on unlimited plans (limit = -1) and on totally unused free
  // workspaces (zero is celebratory, not informational here).
  if (limit < 0) return null
  if (used === 0 && !isPaid) return null

  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100))
  // Threshold for surfacing the upgrade affordance. Free plans get
  // nudged earlier because their cap is the conversion lever; paid
  // plans only see the upgrade prompt near the actual cap.
  const showUpgrade = isPaid ? pct >= 85 : pct >= 50
  // Severity tone for the bar fill — green/yellow/red gradient based
  // on remaining headroom. Matches the narrative-line tone vocabulary
  // so the dashboard speaks one language of severity.
  const tone =
    pct >= 95 ? 'critical' : pct >= 80 ? 'caution' : pct >= 50 ? 'positive' : 'neutral'
  const fillColor =
    tone === 'critical'
      ? '#9B2018'
      : tone === 'caution'
        ? '#CC8425'
        : PALETTE.charcoal
  const remaining = Math.max(0, limit - used)

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-xl px-3.5 py-2.5"
      style={{
        background: 'rgba(255, 253, 248, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${
          tone === 'critical'
            ? 'rgba(155,32,24,0.25)'
            : tone === 'caution'
              ? 'rgba(204,132,37,0.25)'
              : 'rgba(15,15,15,0.08)'
        }`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <span
        className="inline-flex shrink-0 items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em]"
        style={{
          color: PALETTE.inkSoft,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
        }}
      >
        <Sparkles className="h-3 w-3" aria-hidden style={{ color: PALETTE.ink }} />
        {planName}
      </span>

      <span className="text-[12px] font-medium" style={{ color: PALETTE.ink }}>
        {metricLabel}
      </span>

      {/* Progress bar — flex-grows to consume remaining space. Thin,
          cream-tracked, fills with severity color. Aria values surface
          "78% of 150 monthly outputs used" to screen readers. */}
      <div
        className="relative h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-label={`${used} of ${limit} ${metricLabel.toLowerCase()} used this month`}
        style={{ background: 'rgba(15,15,15,0.08)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: fillColor,
            transition: 'width 320ms ease-out',
          }}
        />
      </div>

      <span
        className="shrink-0 text-[11px] tabular-nums"
        style={{
          color: PALETTE.inkSoft,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
        }}
      >
        {used}/{limit === -1 ? '∞' : limit}
        {tone !== 'neutral' && (
          <span className="ml-1.5" style={{ color: fillColor }}>
            · {pct}%
          </span>
        )}
      </span>

      {showUpgrade && (
        <Link
          href={upgradeHref}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-3 text-[11px] font-bold transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_14px_-4px_rgba(15,15,15,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
          style={{
            background: PALETTE.ink,
            color: PALETTE.yellow,
          }}
        >
          {isPaid ? `${remaining} left` : 'Upgrade'}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}
