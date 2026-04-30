import type { ReactNode } from 'react'

/**
 * Editorial page header used across the workspace shell.
 *
 *   <PageHeader category="Import" title="Drop a recording in." description="…" />
 *
 * Three rows: an optional designer-grade category line (a violet
 * hairline + Inter-Tight tracking-wide caps in primary — *not* the
 * generic grey-mono eyebrow that read as boilerplate everywhere), the
 * Instrument-Serif title for editorial weight, and an optional
 * description. Right slot for primary/secondary actions.
 */

interface PageHeaderProps {
  /**
   * Section / category label rendered above the title. Replaces the
   * old `eyebrow` prop — accepts the same value, rendered in the new
   * primary-tone Sans-Tight treatment with a leading hairline.
   */
  category?: string
  /** @deprecated Use `category`. Kept so legacy call-sites still compile. */
  eyebrow?: string
  title: string
  /** Short, action-oriented one-liner. Skip if redundant. */
  description?: string
  /** Right-aligned action buttons (Primary CTA + Secondary). */
  actions?: ReactNode
  /** @deprecated emoji eyebrows are out — pass an icon-prefixed `category` instead. */
  emoji?: string
}

export function PageHeader({
  category,
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  const label = category ?? eyebrow
  return (
    <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {label ? (
          <p
            className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{
              color: '#7A7468',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            <span
              aria-hidden
              className="inline-block h-px w-6"
              style={{ background: 'rgba(15,15,15,0.18)' }}
            />
            {label}
          </p>
        ) : null}
        <h1
          className="text-[clamp(34px,5vw,56px)] leading-[1.02]"
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            letterSpacing: '-0.02em',
            color: '#0F0F0F',
            fontWeight: 400,
          }}
        >
          {title}
        </h1>
        {description ? (
          <p
            className="mt-3 max-w-[640px] text-[14px] leading-relaxed"
            style={{ color: '#3A3A3A' }}
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
