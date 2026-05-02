'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Send,
  Sparkles,
} from 'lucide-react'

import {
  SpotlightCard,
  TiltCard,
  usePrefersReducedMotion,
} from '@/components/ui/editorial-motion'
import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'
import type { NextAction } from '@/lib/dashboard/next-action'

// FeaturedCard — the tall hero tile in the bento. Repurposed from
// "celebrate top performer" to "tell the user what to do next" — the
// largest piece of dashboard real-estate now points at a concrete
// actionable next step, with the legacy top-performer celebration
// reduced to a fallback branch.
//
// Action vocabulary lives in `lib/dashboard/next-action.ts`. Each
// branch has its own copy + CTA href + icon; the visual chrome
// (yellow gradient, tilt, spotlight, grain) stays identical so the
// card still reads as the bento's anchor regardless of which action
// is showing.
export function FeaturedCard({
  workspaceId,
  action,
}: {
  workspaceId: string
  action: NextAction
}) {
  const reduced = usePrefersReducedMotion()

  // Map the action into the four bits we need to render: eyebrow text,
  // headline JSX, optional secondary line, and CTA. Switch lives in
  // one place so adding a new action kind only touches this function +
  // the next-action discriminator.
  const view = renderAction(action, workspaceId)

  return (
    <TiltCard maxTilt={4.5} className="row-span-2 h-full">
      <SpotlightCard
        tone="warm"
        size={520}
        className="group relative flex h-full min-h-[360px] flex-col justify-end overflow-hidden rounded-[24px] p-5 transition-all duration-300"
        style={{
          background: `linear-gradient(170deg, ${PALETTE.yellowSoft} 0%, ${PALETTE.yellow} 55%, ${PALETTE.yellowDeep} 100%)`,
          border: `1px solid ${PALETTE.border}`,
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.55), 0 24px 56px -22px rgba(220,185,31,0.55)',
        }}
      >
        {/* Inner double-border + grain — kept identical to previous
            version so the card's visual identity is action-agnostic. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-3 rounded-[16px] border"
          style={{ borderColor: 'rgba(15,15,15,0.16)' }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{
            opacity: 0.04,
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            backgroundSize: '160px 160px',
          }}
        />

        {/* Top-right ornament. Stuck/connect/fresh actions get an
            attention icon; review/draft/top-performer get a static
            count chip. The Sparkles drift animation only fires for
            the "fresh" branch where the card is celebratory rather
            than urgent. */}
        <span
          aria-hidden
          className="absolute right-5 top-5"
          style={{
            color: PALETTE.ink,
          }}
        >
          {view.cornerNode}
          {action.kind === 'fresh-workspace' && (
            <Sparkles
              aria-hidden
              className="h-7 w-7"
              style={{
                color: PALETTE.ink,
                opacity: 0.28,
                animation: reduced ? undefined : 'sparkle-drift 6s ease-in-out infinite',
              }}
            />
          )}
        </span>

        <div className="relative z-10 flex flex-col gap-1.5 pl-2">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
            style={{
              color: PALETTE.charcoal,
              opacity: 0.7,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            — {view.eyebrow}
          </p>
          <h3
            className="leading-[1.02]"
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              color: PALETTE.ink,
              fontWeight: 400,
              letterSpacing: '-0.014em',
              fontSize: 'clamp(28px, 3vw, 34px)',
            }}
          >
            {view.headline}
          </h3>

          {view.subline && (
            <p
              className="text-[11px] tabular-nums"
              style={{
                color: PALETTE.inkSoft,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              {view.subline}
            </p>
          )}

          <Link
            href={view.ctaHref}
            className="mt-3 inline-flex w-fit items-center gap-1 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 group-hover:translate-x-0.5 group-hover:shadow-[0_6px_18px_rgba(15,15,15,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4D93D]"
            style={{
              background: 'rgba(15,15,15,0.08)',
              color: PALETTE.ink,
              border: `1px solid ${PALETTE.borderStrong}`,
            }}
          >
            {view.ctaLabel}
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </SpotlightCard>
    </TiltCard>
  )
}

interface ActionView {
  eyebrow: string
  headline: React.ReactNode
  subline: string | null
  ctaLabel: string
  ctaHref: string
  /** Top-right ornament — a count chip, an icon-only badge, or null
   *  when the chrome is provided externally (e.g. Sparkles for fresh). */
  cornerNode: React.ReactNode
}

function chip(label: string): React.ReactNode {
  return (
    <span
      className="inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold tabular-nums"
      style={{
        background: 'rgba(15,15,15,0.10)',
        color: PALETTE.ink,
        border: `1px solid ${PALETTE.borderStrong}`,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
      }}
    >
      {label}
    </span>
  )
}

function iconBadge(
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
): React.ReactNode {
  return (
    <span
      aria-hidden
      className="grid h-9 w-9 place-items-center rounded-full"
      style={{
        background: 'rgba(15,15,15,0.10)',
        border: `1px solid ${PALETTE.borderStrong}`,
      }}
    >
      <Icon className="h-4 w-4" style={{ color: PALETTE.ink }} />
    </span>
  )
}

function renderAction(action: NextAction, workspaceId: string): ActionView {
  switch (action.kind) {
    case 'stuck': {
      const { stuck, othersCount } = action
      const moreNote = othersCount > 0 ? ` · ${othersCount} more stuck` : ''
      return {
        eyebrow: 'Today · Review',
        headline: (
          <>
            <span aria-hidden style={{ color: 'rgba(155,32,24,0.85)' }}>
              {stuck.daysSince}d cold:
            </span>{' '}
            {stuck.title ?? 'Untitled draft'}
          </>
        ),
        subline: `${stuck.state === 'draft' ? 'Draft' : 'In review'} · ${stuck.daysSince} days idle${moreNote}`,
        ctaLabel: 'Review now',
        ctaHref: `/workspace/${workspaceId}/content/${stuck.contentId}/outputs`,
        cornerNode: iconBadge(AlertTriangle),
      }
    }

    case 'review': {
      const noun = action.pendingCount === 1 ? 'draft' : 'drafts'
      return {
        eyebrow: 'Today · Review queue',
        headline: (
          <>
            {action.pendingCount} {noun} waiting
            <br />
            for your call.
          </>
        ),
        subline: 'Approve, reject, or send back with a note.',
        ctaLabel: 'Open queue',
        ctaHref: `/workspace/${workspaceId}`,
        cornerNode: chip(`${action.pendingCount}× ready`),
      }
    }

    case 'draft': {
      const noun = action.draftCount === 1 ? 'draft' : 'drafts'
      return {
        eyebrow: 'Today · First pass',
        headline: (
          <>
            {action.draftCount} {noun} ready
            <br />
            for first review.
          </>
        ),
        subline: 'Brand-voice generations sitting in draft state.',
        ctaLabel: 'Start reviewing',
        ctaHref: `/workspace/${workspaceId}`,
        cornerNode: iconBadge(FileText),
      }
    }

    case 'connect-publish': {
      return {
        eyebrow: 'Unlock · Publish',
        headline: (
          <>
            Approved drafts can&rsquo;t go live yet.
          </>
        ),
        subline: 'Connect Upload-Post to schedule across all four channels.',
        ctaLabel: 'Connect publishing',
        ctaHref: `/settings/ai-keys`,
        cornerNode: iconBadge(Send),
      }
    }

    case 'top-performer': {
      const { content } = action
      return {
        eyebrow: 'Top performer',
        headline: <>{content.title ?? 'Untitled'}</>,
        subline: `${content.total_outputs} draft${content.total_outputs === 1 ? '' : 's'}${
          content.starred > 0 ? ` · ${content.starred} starred` : ''
        }`,
        ctaLabel: 'Open drafts',
        ctaHref: `/workspace/${workspaceId}/content/${content.id}/outputs`,
        cornerNode:
          content.starred > 0
            ? chip(`★ ${content.starred}`)
            : chip(`${content.total_outputs}× drafts`),
      }
    }

    case 'fresh-workspace': {
      return {
        eyebrow: 'Workspace',
        headline: <>{action.workspaceName}</>,
        subline: 'No drafts yet. Spin one up to seed the pipeline.',
        ctaLabel: 'Open workflow',
        ctaHref: `/workspace/${workspaceId}`,
        cornerNode: iconBadge(CheckCircle2),
      }
    }
  }
}
