import type { ReactNode } from 'react'

// Shared page-title primitive for authed app surfaces. Pairs a designer-
// grade category line (Inter-Tight tracking-wide caps in primary tone
// with a leading hairline — replacing the old grey-mono eyebrow that
// read as boilerplate) with an Instrument-Serif headline and an
// optional muted body line.
export function PageHeading({
  eyebrow,
  category,
  title,
  body,
  children,
}: {
  /** @deprecated Use `category` — kept so legacy call-sites still compile. */
  eyebrow?: string
  category?: string
  title: ReactNode
  body?: ReactNode
  children?: ReactNode
}) {
  const label = category ?? eyebrow
  return (
    <div>
      {label ? (
        <p
          className="mb-2.5 inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85"
          style={{
            fontFamily:
              'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          <span aria-hidden className="inline-block h-px w-6 bg-primary/40" />
          {label}
        </p>
      ) : null}
      <h1
        className="text-[40px] leading-[1.02] sm:text-[44px]"
        style={{
          fontFamily: 'var(--font-instrument-serif), serif',
          letterSpacing: '-.015em',
          color: '#2A1A3D',
        }}
      >
        {title}
      </h1>
      {body ? (
        <p className="mt-1 text-sm" style={{ color: '#7c7468' }}>
          {body}
        </p>
      ) : null}
      {children}
    </div>
  )
}
