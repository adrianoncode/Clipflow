import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * EmptyState — first-time hero for a page that has no rows yet.
 *
 *   variant="hero"  (default)
 *     A single, focused, page-owning card. Violet-gradient visual chip
 *     on the left, editorial title, single body line, primary CTA,
 *     optional secondary link. No more fake "preview" thumbnails or
 *     boilerplate "1, 2, 3" how-it-works list — those read as onboarding
 *     filler. Pages that genuinely need a steps row can opt in by
 *     passing `steps`; same for `preview`.
 *
 *   variant="compact"
 *     Inline empty state for sub-panels (e.g. an empty section inside
 *     a larger page). Same prop surface, smaller chassis.
 */

interface Step {
  title: string
  body: string
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel: string
  actionHref: string
  secondaryLabel?: string
  secondaryHref?: string
  /** Render mode. Defaults to "hero" — the new big premium card. */
  variant?: 'hero' | 'compact'
  /** Optional numbered micro-steps shown beneath the description.
   *  Most pages don't need this; pipeline / library skip it. */
  steps?: Step[]
  /** Optional rich preview node rendered to the right on desktop.
   *  Most pages don't need this — keeping the hero tight reads cleaner
   *  than a fake-data sample. */
  preview?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
  variant = 'hero',
  steps,
  preview,
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div
        className="relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card px-6 py-10 text-center"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 10px 24px -16px rgba(42,26,61,0.18)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
        />
        <VisualChip Icon={Icon} size="sm" />
        <div className="max-w-md space-y-1.5">
          <p
            className="text-[15px] font-bold tracking-tight text-foreground"
            style={{
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            {title}
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <ActionRow
          label={actionLabel}
          href={actionHref}
          secondaryLabel={secondaryLabel}
          secondaryHref={secondaryHref}
        />
      </div>
    )
  }

  // Hero — page-owning empty state.
  const hasAside = Boolean(preview) || Boolean(steps && steps.length > 0)

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(42,26,61,0.04), 0 22px 44px -28px rgba(42,26,61,0.24)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(42,26,61,0.16) 0%, rgba(42,26,61,0) 60%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
      />

      <div
        className={`relative grid gap-8 p-6 sm:p-9 ${
          hasAside ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10' : ''
        }`}
      >
        {/* Left: visual + title + body + CTA */}
        <div className="flex flex-col">
          <VisualChip Icon={Icon} />
          <h2
            className="mt-5 text-[26px] leading-[1.06] tracking-tight text-foreground sm:text-[30px]"
            style={{
              fontFamily: 'var(--font-instrument-serif), serif',
              letterSpacing: '-.015em',
              color: '#2A1A3D',
            }}
          >
            {title}
          </h2>
          <p className="mt-2.5 max-w-[460px] text-[14px] leading-relaxed text-muted-foreground">
            {description}
          </p>

          {steps && steps.length > 0 ? (
            <ol className="mt-6 space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
                    style={{
                      background:
                        'linear-gradient(140deg, #2A1A3D 0%, #120920 100%)',
                      fontFamily:
                        'var(--font-inter-tight), var(--font-inter), sans-serif',
                      boxShadow:
                        '0 1px 0 rgba(255,255,255,0.18) inset, 0 4px 10px -4px rgba(42,26,61,0.55)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="text-[13.5px] font-bold tracking-tight text-foreground"
                      style={{
                        fontFamily:
                          'var(--font-inter-tight), var(--font-inter), sans-serif',
                      }}
                    >
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          <div className="mt-7 flex items-center gap-3">
            <ActionRow
              label={actionLabel}
              href={actionHref}
              secondaryLabel={secondaryLabel}
              secondaryHref={secondaryHref}
            />
          </div>
        </div>

        {/* Right: optional rich preview */}
        {preview ? (
          <aside className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -m-3 rounded-3xl"
              style={{
                background:
                  'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
                backgroundSize: '14px 14px',
                opacity: 0.35,
                maskImage:
                  'radial-gradient(ellipse at center, black 40%, transparent 80%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse at center, black 40%, transparent 80%)',
              }}
            />
            <div className="relative">{preview}</div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}

function VisualChip({
  Icon,
  size = 'md',
}: {
  Icon: LucideIcon
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 44 : 56
  const iconSize = size === 'sm' ? 18 : 22
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-2xl text-white"
      style={{
        width: dim,
        height: dim,
        background:
          'linear-gradient(140deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.18) inset, 0 10px 24px -12px rgba(42,26,61,0.55)',
      }}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-1 rounded-[14px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
        }}
      />
      <Icon
        className="relative"
        style={{ width: iconSize, height: iconSize }}
        strokeWidth={1.7}
      />
    </span>
  )
}

function ActionRow({
  label,
  href,
  secondaryLabel,
  secondaryHref,
}: {
  label: string
  href: string
  secondaryLabel?: string
  secondaryHref?: string
}) {
  return (
    <>
      <Link
        href={href}
        className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-bold tracking-tight text-background shadow-sm shadow-foreground/[0.18] transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-foreground/[0.28]"
        style={{
          fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
        }}
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
      {secondaryLabel && secondaryHref ? (
        <Link
          href={secondaryHref}
          className="text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          {secondaryLabel}
        </Link>
      ) : null}
    </>
  )
}
