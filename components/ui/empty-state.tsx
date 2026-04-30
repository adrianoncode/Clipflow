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
        className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[24px] px-6 py-10 text-center [box-shadow:inset_0_1px_0_rgba(255,255,255,0.7)]"
        style={{
          background: '#F9F4DC',
          border: '1px solid rgba(15,15,15,0.06)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(15,15,15,0.18), transparent)' }}
        />
        <VisualChip Icon={Icon} size="sm" />
        <div className="max-w-md space-y-1.5">
          <p
            className="text-[15px] font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
              color: '#0F0F0F',
            }}
          >
            {title}
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#3A3A3A' }}>
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
      className="relative overflow-hidden rounded-[28px] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.7)]"
      style={{
        background: '#F9F4DC',
        border: '1px solid rgba(15,15,15,0.06)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(244,217,61,0.32) 0%, rgba(244,217,61,0) 60%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(15,15,15,0.18), transparent)' }}
      />

      <div
        className={`relative grid gap-8 p-6 sm:p-9 grid-cols-[minmax(0,1fr)] ${
          hasAside ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10' : ''
        }`}
      >
        {/* Left: visual + title + body + CTA */}
        <div className="flex min-w-0 flex-col">
          <VisualChip Icon={Icon} />
          <h2
            className="mt-5 text-[28px] leading-[1.04] sm:text-[34px]"
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              letterSpacing: '-0.018em',
              color: '#0F0F0F',
              fontWeight: 400,
            }}
          >
            {title}
          </h2>
          <p
            className="mt-2.5 max-w-[460px] text-[14px] leading-relaxed"
            style={{ color: '#3A3A3A' }}
          >
            {description}
          </p>

          {steps && steps.length > 0 ? (
            <ol className="mt-6 space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold"
                    style={{
                      background: '#0F0F0F',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 10px -4px rgba(15,15,15,0.45)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="text-[13.5px] font-bold tracking-tight"
                      style={{
                        fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
                        color: '#0F0F0F',
                      }}
                    >
                      {s.title}
                    </p>
                    <p
                      className="mt-0.5 text-[12.5px] leading-relaxed"
                      style={{ color: '#3A3A3A' }}
                    >
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
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
          <aside className="relative min-w-0">
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
      className="relative flex shrink-0 items-center justify-center rounded-2xl"
      style={{
        width: dim,
        height: dim,
        background: 'linear-gradient(170deg, #F9E97A 0%, #F4D93D 55%, #DCB91F 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 24px -12px rgba(15,15,15,0.30)',
        color: '#0F0F0F',
        border: '1px solid rgba(15,15,15,0.10)',
      }}
      aria-hidden
    >
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
        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:scale-[1.02]"
        style={{
          background: '#0F0F0F',
          color: '#FFFFFF',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 12px -4px rgba(15,15,15,0.45)',
        }}
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      {secondaryLabel && secondaryHref ? (
        <Link
          href={secondaryHref}
          className="text-[13px] font-semibold transition-colors hover:opacity-80"
          style={{ color: '#3A3A3A' }}
        >
          {secondaryLabel}
        </Link>
      ) : null}
    </>
  )
}
