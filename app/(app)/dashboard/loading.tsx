'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Upload } from 'lucide-react'
import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'

/**
 * Dashboard loading state — shows structural skeleton shimmer that
 * mirrors the real bento layout so the page feels like it's "filling
 * in" rather than constructing from scratch.
 *
 * **Timeout fallback (4 s):** if data hasn't resolved after 4 seconds
 * (slow connection, cold start, new user with empty DB that still
 * takes time to query), the skeleton dissolves into a welcoming
 * hero with a clear CTA. This ensures a new user never stares at
 * grey blocks indefinitely.
 */
const SKELETON_TIMEOUT_MS = 4_000
const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/** Read the workspace ID from the client-side cookie, if set. */
function readWorkspaceId(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CURRENT_WORKSPACE_COOKIE}=`))
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : null
}

export default function DashboardLoading() {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), SKELETON_TIMEOUT_MS)
    return () => clearTimeout(id)
  }, [])

  if (timedOut) {
    return <TimeoutHero />
  }

  return <SkeletonDashboard />
}

// ── Timeout hero — welcoming fallback after skeleton expires ─────────
function TimeoutHero() {
  const workspaceId = readWorkspaceId()
  const importHref = workspaceId
    ? `/workspace/${workspaceId}/content/new`
    : '/dashboard'

  return (
    <div className="min-h-full p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-center gap-8 py-16">
        <div
          className="relative w-full max-w-2xl overflow-hidden rounded-[28px] p-8 sm:p-12"
          style={{
            background: `linear-gradient(160deg, ${PALETTE.yellowSoft} 0%, ${PALETTE.yellow} 55%, ${PALETTE.yellowDeep} 100%)`,
            border: `1px solid ${PALETTE.border}`,
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.55), 0 18px 46px -22px rgba(220,185,31,0.45)',
          }}
        >
          {/* Inset border */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-[20px] border"
            style={{ borderColor: 'rgba(15,15,15,0.16)' }}
          />
          {/* Noise texture */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{
              opacity: 0.04,
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
              backgroundSize: '160px 160px',
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <span
              className="text-[10px] font-semibold uppercase"
              style={{
                color: 'rgba(15,15,15,0.6)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                letterSpacing: '0.22em',
              }}
            >
              — Almost there
            </span>
            <h2
              className="m-0"
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontSize: 'clamp(32px, 4.2vw, 48px)',
                lineHeight: 1.05,
                letterSpacing: '-0.022em',
                color: PALETTE.ink,
                fontWeight: 400,
              }}
            >
              Welcome to Clipflow
            </h2>
            <p
              className="m-0 max-w-[44ch] text-[14px]"
              style={{ color: PALETTE.inkSoft, lineHeight: 1.55 }}
            >
              Your dashboard is still loading — but you can get started
              right away. Import a video and let Clipflow turn it into a
              month of posts.
            </p>

            <Link
              href={importHref}
              className="inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-[14px] font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_10px_22px_-6px_rgba(15,15,15,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{
                background: PALETTE.ink,
                color: '#FFFFFF',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 18px -6px rgba(15,15,15,0.45)',
              }}
            >
              <Upload className="h-4 w-4" />
              Import your first video
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton dashboard (same structural shimmer as before) ──────────
function SkeletonDashboard() {
  return (
    <div className="min-h-full p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        {/* Hero: kicker + serif title + 3 KPIs */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0 flex-1 space-y-3">
              <Shimmer className="h-3 w-44 rounded-full" />
              <Shimmer className="h-12 w-[420px] max-w-full rounded-xl" />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-7 sm:gap-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-end gap-2">
                  <Shimmer className="h-7 w-7 rounded-full" />
                  <Shimmer className="h-12 w-20 rounded-md" />
                </div>
                <Shimmer className="ml-9 h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </section>

        {/* Narrative line */}
        <Shimmer className="h-12 w-full rounded-2xl" />

        {/* Quota row */}
        <Shimmer className="h-11 w-full rounded-xl" />

        {/* Range-filter row */}
        <div className="flex items-center justify-between gap-3">
          <Shimmer className="h-3 w-28 rounded" />
          <Shimmer className="h-9 w-32 rounded-full" />
        </div>

        {/* Pulse strip — 4 pills */}
        <section
          className="rounded-[20px] p-3.5"
          style={{
            background: 'rgba(255, 253, 248, 0.55)',
            border: '1px solid rgba(15,15,15,0.08)',
          }}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Shimmer key={i} className="h-9 rounded-full" />
            ))}
          </div>
        </section>

        {/* Bento grid */}
        <section className="grid auto-rows-[220px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* FeaturedCard placeholder (yellow gradient, row-span-2) */}
          <div
            className="row-span-2 rounded-[24px] p-5"
            style={{
              background: `linear-gradient(170deg, ${PALETTE.yellowSoft} 0%, ${PALETTE.yellow} 55%, ${PALETTE.yellowDeep} 100%)`,
              border: `1px solid ${PALETTE.border}`,
              opacity: 0.55,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
            }}
            aria-hidden
          />
          {/* BarChart placeholder */}
          <div
            className="rounded-[24px] p-5"
            style={{
              background: PALETTE.cardCream,
              border: `1px solid ${PALETTE.border}`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            <div className="space-y-3">
              <Shimmer className="h-3 w-16 rounded" />
              <Shimmer className="h-8 w-12 rounded" />
              <div className="flex items-end gap-1.5 pt-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Shimmer
                    key={i}
                    className="flex-1 rounded-full"
                    style={{ height: `${30 + ((i * 13) % 50)}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* Donut placeholder */}
          <div
            className="rounded-[24px] p-5"
            style={{
              background: PALETTE.cardCream,
              border: `1px solid ${PALETTE.border}`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            <div className="flex h-full flex-col items-center justify-between">
              <Shimmer className="self-start h-3 w-20 rounded" />
              <Shimmer className="h-[110px] w-[110px] rounded-full" />
              <Shimmer className="self-start h-5 w-24 rounded-full" />
            </div>
          </div>
          {/* Funnel + stuck drafts (row-span-2) */}
          <div className="row-span-2 flex flex-col gap-3">
            <div
              className="rounded-[24px] p-5"
              style={{
                background: PALETTE.cardCream,
                border: `1px solid ${PALETTE.border}`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Shimmer className="h-3 w-12 rounded" />
                  <Shimmer className="h-6 w-12 rounded" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Shimmer className="h-5 w-5 rounded-full" />
                    <Shimmer className="h-3 w-14 rounded" />
                    <Shimmer className="h-7 flex-1 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <div
              className="flex-1 rounded-[24px] p-5"
              style={{
                background: PALETTE.charcoal,
                border: '1px solid rgba(255,255,255,0.04)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div className="space-y-3">
                <Shimmer className="h-3 w-20 rounded" tone="dark" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Shimmer className="h-7 w-7 rounded-md" tone="dark" />
                    <div className="flex-1 space-y-1">
                      <Shimmer className="h-3 w-full rounded" tone="dark" />
                      <Shimmer className="h-2 w-1/2 rounded" tone="dark" />
                    </div>
                    <Shimmer className="h-6 w-6 rounded-full" tone="dark" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Schedule preview placeholder */}
          <div
            className="rounded-[24px] p-5"
            style={{
              background: PALETTE.cardCream,
              border: `1px solid ${PALETTE.border}`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            <div className="flex h-full flex-col justify-between gap-3">
              <Shimmer className="h-3 w-16 rounded" />
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <Shimmer className="h-2 w-3 rounded" />
                    <Shimmer className="h-7 w-7 rounded-full" />
                  </div>
                ))}
              </div>
              <Shimmer className="h-7 w-full rounded-lg" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Shimmer primitive ───────────────────────────────────────────────
interface ShimmerProps {
  className?: string
  /** "dark" renders white-on-charcoal for the stuck-drafts panel. */
  tone?: 'light' | 'dark'
  style?: React.CSSProperties
}

function Shimmer({ className = '', tone = 'light', style }: ShimmerProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse ${className}`}
      style={{
        background:
          tone === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(15,15,15,0.08)',
        ...style,
      }}
    />
  )
}
