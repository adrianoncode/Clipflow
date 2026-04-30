import type { ReactNode } from 'react'

/**
 * Top-of-page hero for account-style settings (Profile, Workspace).
 * Pairs an initial-letter monogram in a violet gradient halo with a
 * sans-display title and one-line summary — gives the page an
 * actual identity instead of fading straight into the section list.
 *
 * Render order (left → right):
 *   [monogram chip]   eyebrow
 *                     Title.
 *                     Body line.                     [optional slot]
 */
export function SettingsHero({
  monogram,
  visual,
  eyebrow,
  title,
  body,
  meta,
  action,
}: {
  /** 1–2 character monogram drawn in the violet chip. Ignored if `visual` is set. */
  monogram?: string
  /** Custom visual to drop in place of the monogram (e.g. an icon or logo). */
  visual?: ReactNode
  /** Small all-caps label above the title. */
  eyebrow?: string
  title: string
  body?: ReactNode
  /** Optional inline meta line below body — mono, muted (e.g. email). */
  meta?: ReactNode
  /** Right-aligned slot, e.g. status pill or a primary action. */
  action?: ReactNode
}) {
  const initials = (monogram ?? '').slice(0, 2).toUpperCase()
  return (
    <section
      className="relative overflow-hidden rounded-[28px] px-5 py-6 sm:px-7 sm:py-7 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.7)]"
      style={{
        background: '#F9F4DC',
        border: '1px solid rgba(15,15,15,0.06)',
      }}
    >
      {/* Soft yellow glow tucked behind the monogram so the hero has
          real depth without becoming a billboard. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(244,217,61,0.30) 0%, rgba(244,217,61,0) 60%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(15,15,15,0.18), transparent)' }}
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {visual ?? <Monogram initials={initials || '··'} />}
          <div className="min-w-0">
            {eyebrow ? (
              <p
                className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{
                  color: '#7A7468',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                <span
                  className="inline-block h-px w-4"
                  style={{ background: 'rgba(15,15,15,0.18)' }}
                />
                {eyebrow}
              </p>
            ) : null}
            <h1
              className="text-[clamp(28px,3.5vw,38px)] leading-[1.02]"
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                letterSpacing: '-0.018em',
                color: '#0F0F0F',
                fontWeight: 400,
              }}
            >
              {title}
            </h1>
            {body ? (
              <p
                className="mt-2 max-w-xl text-[13px] leading-relaxed"
                style={{ color: '#3A3A3A' }}
              >
                {body}
              </p>
            ) : null}
            {meta ? (
              <p
                className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] tabular-nums"
                style={{
                  color: '#7A7468',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                {meta}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  )
}

function Monogram({ initials }: { initials: string }) {
  return (
    <span
      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[18px] font-bold tracking-tight sm:h-16 sm:w-16 sm:text-[20px]"
      style={{
        background: 'linear-gradient(170deg, #F9E97A 0%, #F4D93D 55%, #DCB91F 100%)',
        color: '#0F0F0F',
        fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 24px -12px rgba(15,15,15,0.30)',
        border: '1px solid rgba(15,15,15,0.10)',
      }}
    >
      <span className="relative">{initials}</span>
    </span>
  )
}
