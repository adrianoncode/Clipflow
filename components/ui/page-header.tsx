import type { ReactNode } from 'react'

/**
 * Editorial page header used across the workspace shell. Three-row
 * layout: eyebrow (mono · uppercase) → big serif title → optional
 * one-line description. Optional `actions` slot floats right on
 * desktop and stacks below the title on mobile.
 *
 * Replaces the ad-hoc "Eyebrow + h1 + p" patterns that drifted
 * across pages and made the dashboard feel like 12 different apps
 * stitched together.
 */

interface PageHeaderProps {
  eyebrow?: string
  title: string
  /** Short, action-oriented one-liner. Skip if redundant. */
  description?: string
  /** Right-aligned action buttons (Primary CTA + Secondary). */
  actions?: ReactNode
  /** Optional emoji/icon shown next to the eyebrow. */
  emoji?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  emoji,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p
            className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            {emoji ? <span aria-hidden>{emoji}</span> : null}
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="text-[34px] leading-[1.05] sm:text-[44px]"
          style={{
            fontFamily: 'var(--font-instrument-serif), serif',
            letterSpacing: '-.015em',
            color: '#2A1A3D',
          }}
        >
          {title}
        </h1>
        {description ? (
          <p
            className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-muted-foreground"
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
