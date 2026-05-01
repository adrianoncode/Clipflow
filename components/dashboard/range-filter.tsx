'use client'

import * as React from 'react'
import Link from 'next/link'

import {
  ALL_RANGES,
  RANGE_SHORT_LABELS,
  type DashboardRange,
} from '@/lib/dashboard/range'
import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'

// RangeFilter — segmented control for the dashboard time-range.
//
// State lives in the URL (`?range=30d`) so the selection survives
// reload, share-link, and browser back/forward. Each pill is a real
// `<Link>` rather than a button — Cmd-click opens in a new tab,
// middle-click works, and pre-selecting via deep-link is trivial.
//
// Visual style mirrors the in-app pulse-strip glassy treatment so the
// filter reads as part of the dashboard chrome, not a separate widget.
export function RangeFilter({ active }: { active: DashboardRange }) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard time range"
      className="inline-flex items-center gap-1 rounded-full p-1"
      style={{
        background: 'rgba(255, 253, 248, 0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(15,15,15,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      {ALL_RANGES.map((r) => {
        const isActive = r === active
        return (
          <Link
            key={r}
            // Default range (`7d`) drops the param entirely so the bare
            // `/dashboard` URL stays canonical. Sharing a default-range
            // dashboard link doesn't carry the noisy `?range=7d` suffix.
            href={r === '7d' ? '/dashboard' : `/dashboard?range=${r}`}
            role="tab"
            aria-selected={isActive}
            // Replace history rather than push, so the back button
            // doesn't get polluted with every range click. Filter state
            // is persistent UI, not a navigation step the user wants
            // to retrace.
            scroll={false}
            replace
            className="lv2-mono inline-flex h-7 items-center rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              background: isActive ? PALETTE.ink : 'transparent',
              color: isActive ? PALETTE.yellow : PALETTE.inkSoft,
              boxShadow: isActive
                ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 14px -4px rgba(15,15,15,0.35)'
                : 'none',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            {RANGE_SHORT_LABELS[r]}
          </Link>
        )
      })}
    </div>
  )
}
