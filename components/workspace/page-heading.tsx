import type { ReactNode } from 'react'

// Shared page-title primitive for authed app surfaces. Renders the same
// mono-eyebrow → Instrument Serif headline → muted body pattern used on
// Dashboard / Billing / Analytics so every in-app page reads as one system.
export function PageHeading({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow?: string
  title: ReactNode
  body?: ReactNode
  children?: ReactNode
}) {
  return (
    <div>
      {eyebrow ? (
        <p
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: '#7c7468', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {eyebrow}
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
