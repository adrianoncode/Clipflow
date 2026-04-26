import type { ReactNode } from 'react'

/**
 * Editorial settings primitives — replaces the bloated
 * "rounded-3xl SectionCard with header" pattern with a denser
 * data-sheet style: mono section labels, hairline-divided rows,
 * label/body/action in a single line.
 *
 * Used across all /settings sub-pages so the rhythm is consistent.
 */

export function SettingsSection({
  num,
  title,
  hint,
  children,
}: {
  /** Editorial section number — "01", "02", etc. */
  num: string
  /** Section heading shown on the same line as the number. */
  title: string
  /** Optional one-liner explaining what this section contains. */
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="text-primary">{num}</span>
          {' · '}
          {title}
        </p>
        {hint ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
            {hint}
          </p>
        ) : null}
      </div>

      {/* Rows live in a single bordered container with hairline
          dividers, not nested cards. Reads like a data sheet. */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/[0.02] [&>*+*]:border-t [&>*+*]:border-border/50">
        {children}
      </div>
    </section>
  )
}

export function SettingsRow({
  label,
  description,
  control,
  align = 'center',
}: {
  /** Mono uppercase label on the left. */
  label: string
  /** Plain-language description / current value sitting below. */
  description?: ReactNode
  /** The interactive piece on the right (button, input, link). */
  control: ReactNode
  /** Align the control vertically — top for taller controls (form
   *  groups), center for single-line buttons. */
  align?: 'top' | 'center'
}) {
  return (
    <div
      className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:gap-4 sm:px-5 sm:py-4 ${
        align === 'top' ? 'sm:items-start' : 'sm:items-center'
      }`}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
          {label}
        </p>
        {description ? (
          <div className="text-[12.5px] leading-snug text-foreground/85">
            {description}
          </div>
        ) : null}
      </div>
      <div className="shrink-0 sm:max-w-[60%]">{control}</div>
    </div>
  )
}

/** Footer line under a section — for reassurances, fine print, etc. */
export function SettingsFootnote({
  icon,
  children,
}: {
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <p className="flex items-start gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
      {icon ? <span className="mt-0.5">{icon}</span> : null}
      <span className="normal-case tracking-normal">{children}</span>
    </p>
  )
}
