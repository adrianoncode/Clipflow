'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, FileVideo } from 'lucide-react'

import {
  CountUp,
  useMountTween,
  usePrefersReducedMotion,
} from '@/components/ui/editorial-motion'
import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'

const STATE_LABEL: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
}

// FunnelStackCard — funnel ladder + stuck-drafts list.
//
// Funnel bars: animated mount (staggered top→bottom, 0 → target width).
// Each row highlights on hover with a slight lift + arrow chip emphasis.
// Stuck-drafts rows: hover slides the chevron CTA in from the right.
export function FunnelStackCard({
  stage1Pct,
  stage2Pct,
  stage3Pct,
  overallPct,
  stuckDrafts,
  workspaceId,
}: {
  stage1Pct: number
  stage2Pct: number
  stage3Pct: number
  overallPct: number
  stuckDrafts: Array<{
    id: string
    title: string | null
    state: 'draft' | 'review'
    daysSince: number
    contentId: string
  }>
  workspaceId: string
}) {
  const stage2Conv = stage1Pct > 0 ? Math.round((stage2Pct / stage1Pct) * 100) : 0
  const stage3Conv = stage2Pct > 0 ? Math.round((stage3Pct / stage2Pct) * 100) : 0

  return (
    <div className="flex flex-col gap-3 row-span-2" style={{ minHeight: 360 }}>
      <div
        className="flex flex-col gap-2 rounded-[24px] p-5"
        style={{
          background: PALETTE.cardCream,
          border: `1px solid ${PALETTE.border}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
            Funnel
          </span>
          <CountUp
            value={overallPct}
            duration={1100}
            format={(n) => `${n}%`}
            className="text-[26px] leading-none tabular-nums"
            style={{
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
              color: PALETTE.ink,
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <FunnelLadderRow
            label="Imported"
            widthPct={stage1Pct > 0 ? 100 : 0}
            variant="yellow"
            index={0}
          />
          <FunnelArrow conversion={stage2Conv} index={0} />
          <FunnelLadderRow label="Approved" widthPct={stage2Pct} variant="dark" index={1} />
          <FunnelArrow conversion={stage3Conv} index={1} />
          <FunnelLadderRow label="Live" widthPct={stage3Pct} variant="muted" index={2} />
        </div>
      </div>

      {/* Stuck drafts dark task list */}
      <div
        className="flex flex-1 flex-col gap-3 rounded-[24px] p-5"
        style={{
          background: PALETTE.charcoal,
          border: '1px solid rgba(255,255,255,0.04)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold" style={{ color: '#FFFFFF' }}>
            Stuck drafts
          </span>
          <span
            className="text-[11px] tabular-nums"
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            {stuckDrafts.length}
          </span>
        </div>

        {stuckDrafts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-6 w-6" style={{ color: PALETTE.yellow }} />
            <p className="text-[12px] font-semibold" style={{ color: '#FFFFFF' }}>
              You&apos;re caught up.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {stuckDrafts.slice(0, 5).map((d, i) => (
              <StuckDraftRow
                key={d.id}
                draft={d}
                workspaceId={workspaceId}
                index={i}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StuckDraftRow({
  draft,
  workspaceId,
  index,
}: {
  draft: {
    id: string
    title: string | null
    state: 'draft' | 'review'
    daysSince: number
    contentId: string
  }
  workspaceId: string
  index: number
}) {
  const [hovered, setHovered] = React.useState(false)
  const reduced = usePrefersReducedMotion()
  return (
    <li
      className="group/row relative flex items-center gap-2.5 rounded-lg p-1 transition-colors duration-150"
      style={{
        background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        // Stagger-in animation gated by the hook. Keyframe lives in
        // app/globals.css so we don't ship a per-instance scoped block
        // and don't have to fight a brittle :global selector.
        animation: reduced
          ? undefined
          : `stuck-row-in 320ms cubic-bezier(0.2,0.9,0.25,1.18) ${index * 60}ms both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150"
        style={{
          background: hovered ? 'rgba(244,217,61,0.14)' : 'rgba(255,255,255,0.07)',
        }}
        aria-hidden
      >
        <FileVideo
          className="h-3 w-3 transition-colors duration-150"
          style={{ color: hovered ? PALETTE.yellow : 'rgba(255,255,255,0.7)' }}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold" style={{ color: '#FFFFFF' }}>
          {draft.title ?? 'Untitled'}
        </p>
        <p
          className="text-[10px] tabular-nums"
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
          }}
        >
          {STATE_LABEL[draft.state] ?? draft.state} · {draft.daysSince}d cold
        </p>
      </div>
      {/* The CTA is visually 24×24 (yellow chevron pill) but the
          interactive hit-area is 44×44 via an invisible inset. WCAG
          2.1 AA tap-target is 44px on touch — applying it here was
          critical because the row is dense and a thumb miss-click on
          the row's :hover-state used to scroll the panel instead of
          activating the draft review link. */}
      <Link
        href={`/workspace/${workspaceId}/content/${draft.contentId}/outputs`}
        aria-label={`Review ${draft.title ?? 'draft'}`}
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4D93D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]"
      >
        <span
          aria-hidden
          className="grid h-6 w-6 place-items-center rounded-full"
          style={{
            background: PALETTE.yellow,
            transform: hovered ? 'translateX(4px) scale(1.06)' : 'translateX(0) scale(1)',
            transition: 'transform 220ms cubic-bezier(0.2,0.9,0.25,1.18)',
            boxShadow: hovered ? '0 6px 16px rgba(220,185,31,0.45)' : 'none',
          }}
        >
          <ChevronRight className="h-3 w-3" style={{ color: PALETTE.ink }} />
        </span>
      </Link>
    </li>
  )
}

// FunnelLadderRow — animated stage row.
function FunnelLadderRow({
  label,
  widthPct,
  variant,
  index,
}: {
  label: string
  widthPct: number
  variant: 'yellow' | 'dark' | 'muted'
  index: number
}) {
  // Stagger: 220ms baseline + 180ms per row top→bottom, plus 320ms to
  // clear the parent <Reveal>'s fade so bars don't grow under fog.
  const t = useMountTween(900, 540 + index * 180)
  const animatedW = widthPct * t

  const [hovered, setHovered] = React.useState(false)

  const fill =
    variant === 'yellow'
      ? PALETTE.yellow
      : variant === 'dark'
        ? PALETTE.charcoal
        : 'rgba(15, 15, 15, 0.22)'
  const pctColor = variant === 'dark' ? '#FFFFFF' : PALETTE.ink
  const w = Math.max(4, Math.min(100, animatedW))
  const pctOutside = w < 18

  const stageLetter = label.charAt(0).toUpperCase()
  return (
    <div
      className="flex items-center gap-3 transition-colors duration-150"
      style={{
        background: hovered ? 'rgba(15,15,15,0.04)' : 'transparent',
        borderRadius: 8,
        padding: 2,
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold tabular-nums transition-transform duration-200"
        style={{
          background:
            variant === 'yellow'
              ? PALETTE.ink
              : variant === 'dark'
                ? PALETTE.yellow
                : 'rgba(15,15,15,0.10)',
          color:
            variant === 'yellow'
              ? PALETTE.yellow
              : variant === 'dark'
                ? PALETTE.ink
                : PALETTE.inkSoft,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          transform: hovered ? 'scale(1.12)' : 'scale(1)',
        }}
        aria-hidden
      >
        {stageLetter}
      </span>
      <span
        className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: PALETTE.inkSoft }}
      >
        {label}
      </span>
      <div className="relative h-7 flex-1">
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full px-2.5"
          style={{
            width: `${w}%`,
            background: fill,
            transition: 'box-shadow 220ms ease-out',
            boxShadow:
              variant === 'yellow'
                ? hovered
                  ? 'inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 18px rgba(220,185,31,0.35)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.45), 0 1px 2px rgba(15,15,15,0.05)'
                : variant === 'dark'
                  ? hovered
                    ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 18px rgba(15,15,15,0.30)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  : undefined,
          }}
        >
          {!pctOutside && (
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{
                color: pctColor,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              {Math.round(animatedW)}%
            </span>
          )}
        </div>
        {pctOutside && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums"
            style={{
              left: `calc(${w}% + 8px)`,
              color: PALETTE.inkSoft,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            {Math.round(animatedW)}%
          </span>
        )}
      </div>
    </div>
  )
}

function FunnelArrow({ conversion, index }: { conversion: number; index: number }) {
  // Arrow chips fade in just after the bar above resolves; +320ms to
  // sit on top of <Reveal>'s fade-up.
  const t = useMountTween(400, 640 + index * 180)
  return (
    <div
      className="flex items-center gap-1.5 pl-3"
      style={{
        opacity: t,
        transform: `translateY(${(1 - t) * 4}px)`,
        transition: 'none',
      }}
    >
      <span
        aria-hidden
        className="block h-3 w-px"
        style={{ background: 'rgba(15,15,15,0.18)' }}
      />
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.14em] tabular-nums"
        style={{
          color: PALETTE.inkSoft,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
        }}
      >
        ↓ {conversion}%
      </span>
    </div>
  )
}
