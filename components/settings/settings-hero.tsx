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
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-5 py-6 sm:px-7 sm:py-7"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(42,26,61,0.05), 0 18px 38px -22px rgba(42,26,61,0.22)',
      }}
    >
      {/* Soft brand glow tucked behind the monogram so the hero has
          real depth without becoming a billboard. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0) 60%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {visual ?? <Monogram initials={initials || '··'} />}
          <div className="min-w-0">
            {eyebrow ? (
              <p
                className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/75"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <span className="inline-block h-px w-4 bg-primary/40" />
                {eyebrow}
              </p>
            ) : null}
            <h1
              className="text-[24px] font-bold leading-[1.05] tracking-tight text-foreground sm:text-[28px]"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              {title}
            </h1>
            {body ? (
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                {body}
              </p>
            ) : null}
            {meta ? (
              <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11.5px] tracking-tight text-muted-foreground/85">
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
      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[18px] font-bold tracking-tight text-white sm:h-16 sm:w-16 sm:text-[20px]"
      style={{
        background:
          'linear-gradient(140deg, #7C3AED 0%, #4B0FB8 60%, #2A1A3D 100%)',
        fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.18) inset, 0 10px 24px -12px rgba(75,15,184,0.55)',
      }}
    >
      {/* Inner highlight arc — the kind of detail that tells the eye
          this is a designed object, not a flat colored square. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-1 rounded-[14px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
        }}
      />
      <span className="relative">{initials}</span>
    </span>
  )
}
