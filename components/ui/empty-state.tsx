import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * EmptyState — two visual variants for two roles.
 *
 *   variant="hero"  (default)
 *     Used on whole-page first-time experiences. Three-column layout:
 *     a stylised PREVIEW of what the populated state will look like
 *     (passed via `preview`), a tight three-step "how this works" list,
 *     and a primary CTA. No more dashed-border placeholder feel.
 *
 *   variant="compact"
 *     Used inside lists / panels where a hero-sized empty state would
 *     dominate. Falls back to the legacy centered-icon-text-button
 *     layout but with sharper typography and no dashed border.
 *
 * Both variants share the same prop surface so existing callers can
 * keep using <EmptyState icon=... title=... description=.../> and
 * just inherit the new look. Pass `preview` + `steps` to opt into
 * the richer hero treatment.
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
  /** Render mode. Defaults to "hero" — the new big preview layout. */
  variant?: 'hero' | 'compact'
  /** Numbered list of micro-steps shown next to the preview. */
  steps?: Step[]
  /** A JSX preview of what the populated state will look like. */
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
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card/40 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="max-w-md space-y-1.5">
          <p className="text-[15px] font-bold text-foreground">{title}</p>
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
  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Left: title + steps + CTA */}
        <div className="flex flex-col">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="mt-4 text-[22px] font-bold leading-tight text-foreground sm:text-[26px]">
            {title}
          </h2>
          <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-muted-foreground">
            {description}
          </p>

          {steps && steps.length > 0 ? (
            <ol className="mt-6 space-y-3.5">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground">
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

        {/* Right: preview of the populated state */}
        {preview ? (
          <div className="relative">
            {/* Subtle dashed grid backdrop — gives the preview "depth"
                without falling back to the cheap dashed-border look. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -m-3 rounded-3xl"
              style={{
                background:
                  'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
                backgroundSize: '14px 14px',
                opacity: 0.4,
                maskImage:
                  'radial-gradient(ellipse at center, black 40%, transparent 80%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse at center, black 40%, transparent 80%)',
              }}
            />
            <div className="relative">{preview}</div>
            <p
              className="mt-3 text-center text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground/70"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              Preview · what your library will look like
            </p>
          </div>
        ) : null}
      </div>
    </div>
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
        className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25"
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
