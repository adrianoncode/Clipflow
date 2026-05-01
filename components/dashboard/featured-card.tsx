'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

import {
  SpotlightCard,
  TiltCard,
  usePrefersReducedMotion,
} from '@/components/ui/editorial-motion'
import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'

// FeaturedCard — the tall hero tile in the bento.
//
// Layered motion:
//   • TiltCard outer wrapper: 3D tilt up to 4° on cursor.
//   • SpotlightCard inner: warm cream gradient follows cursor.
//   • Sparkles icon (when no featured): slow ambient drift + opacity wobble.
//   • CTA chip: arrow pulls right on group-hover.
//   • Whole tile lifts on hover with a yellow drop-shadow.
export function FeaturedCard({
  workspaceId,
  featured,
  workspaceName,
}: {
  workspaceId: string
  featured: { id: string; title: string | null; starred: number; total_outputs: number } | null
  workspaceName: string
}) {
  const hasFeatured = featured !== null
  const reduced = usePrefersReducedMotion()

  return (
    <TiltCard maxTilt={3.5} className="row-span-2 h-full">
      <SpotlightCard
        tone="warm"
        size={380}
        className="group relative flex h-full min-h-[360px] flex-col justify-end overflow-hidden rounded-[24px] p-5 transition-all duration-300"
        style={{
          background: `linear-gradient(170deg, ${PALETTE.yellowSoft} 0%, ${PALETTE.yellow} 55%, ${PALETTE.yellowDeep} 100%)`,
          border: `1px solid ${PALETTE.border}`,
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.55), 0 18px 46px -22px rgba(220,185,31,0.45)',
        }}
      >
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

        {!hasFeatured && (
          <Sparkles
            aria-hidden
            className="absolute right-7 top-7 h-7 w-7"
            style={{
              color: PALETTE.ink,
              opacity: 0.28,
              // Animation gated by the hook (not a brittle :global
              // selector) so we never disable an unrelated element that
              // happens to share these Tailwind classes. Keyframe lives
              // in app/globals.css.
              animation: reduced ? undefined : 'sparkle-drift 6s ease-in-out infinite',
            }}
          />
        )}

        {hasFeatured && (
          <span
            className="absolute right-5 top-5 inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold tabular-nums"
            style={{
              background: 'rgba(15,15,15,0.10)',
              color: PALETTE.ink,
              border: `1px solid ${PALETTE.borderStrong}`,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            {featured.total_outputs}× drafts
          </span>
        )}

        <div className="relative z-10 flex flex-col gap-1.5 pl-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{
              color: PALETTE.charcoal,
              opacity: 0.6,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            {hasFeatured ? 'Top performer' : 'Workspace'}
          </p>
          <h3
            className="text-[26px] leading-[1.02]"
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              color: PALETTE.ink,
              fontWeight: 400,
              letterSpacing: '-0.012em',
            }}
          >
            {hasFeatured ? (featured.title ?? 'Untitled') : workspaceName}
          </h3>

          {hasFeatured && (
            <p
              className="text-[11px] tabular-nums"
              style={{
                color: PALETTE.inkSoft,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              {featured.total_outputs} draft{featured.total_outputs === 1 ? '' : 's'}
              {featured.starred > 0 ? ` · ${featured.starred} starred` : ''}
            </p>
          )}

          <Link
            href={
              hasFeatured
                ? `/workspace/${workspaceId}/content/${featured.id}/outputs`
                : `/workspace/${workspaceId}`
            }
            className="mt-3 inline-flex w-fit items-center gap-1 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 group-hover:translate-x-0.5 group-hover:shadow-[0_6px_18px_rgba(15,15,15,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4D93D]"
            style={{
              background: 'rgba(15,15,15,0.08)',
              color: PALETTE.ink,
              border: `1px solid ${PALETTE.borderStrong}`,
            }}
          >
            {hasFeatured ? 'Open drafts' : 'Open workflow'}
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </SpotlightCard>
    </TiltCard>
  )
}
