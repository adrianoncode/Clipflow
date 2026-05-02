import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'

/**
 * Dashboard loading state — mirrors the post-Phase-3 bento exactly.
 *
 * Generic shimmer-only skeletons "feel" lazy because the user sees
 * the layout flash from "nothing" to "everything" on load. By
 * rendering the same shape as the real dashboard (hero, narrative,
 * quota, range filter, pulse strip, 4-col bento with FeaturedCard
 * row-span-2 + Funnel row-span-2), the page reads as "loading the
 * data into a known surface" instead of "constructing a surface".
 *
 * No animation library — the shimmer keyframe lives in globals.css.
 * Keeping this static + paint-only ensures the loading state is the
 * cheapest possible thing to render.
 */
export default function DashboardLoading() {
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

        {/* Bento grid — FeaturedCard row-span-2 + 3 mid-tiles + Funnel row-span-2 */}
        <section className="grid auto-rows-[220px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* FeaturedCard placeholder (yellow gradient hint, row-span-2) */}
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

interface ShimmerProps {
  className?: string
  /** "dark" → renders white-on-charcoal for the stuck-drafts panel. */
  tone?: 'light' | 'dark'
  style?: React.CSSProperties
}

/**
 * Single skeleton primitive — keeps the dashboard's loading.tsx
 * stand-alone so it doesn't depend on shadcn `Skeleton` or any other
 * loading util. Pulses are a CSS keyframe (in globals.css), no JS.
 */
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
