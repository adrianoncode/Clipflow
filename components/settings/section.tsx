import type { ReactNode } from 'react'

/**
 * Designer-level settings primitives. Reads like a polished SaaS
 * console (Linear / Vercel / Stripe) — not a developer data-sheet.
 *
 *   <SettingsSection title="Identity" hint="…">
 *     <SettingsRow label="Email" description="…" control={…} />
 *     <SettingsRow label="Display name" … />
 *   </SettingsSection>
 *
 * Section header uses sans-display + sentence case (no mono uppercase
 * eyebrows). Rows are hairline-divided, generous vertical breathing
 * room, label/description left + control right.
 */

export function SettingsSection({
  title,
  hint,
  children,
  /** Optional right-aligned slot in the section header (e.g. a "View all" link). */
  action,
}: {
  title: string
  hint?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="text-[20px] font-bold leading-tight tracking-tight text-foreground sm:text-[22px]"
            style={{ fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif' }}
          >
            {title}
          </h2>
          {hint ? (
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/[0.03] [&>*+*]:border-t [&>*+*]:border-border/60">
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
  /** Sentence-case label, primary foreground, semibold. */
  label: string
  /** Plain-language description / current value. */
  description?: ReactNode
  /** Interactive piece on the right (button, input, link). */
  control: ReactNode
  /** Align the control vertically — top for taller controls. */
  align?: 'top' | 'center'
}) {
  return (
    <div
      className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:gap-6 sm:px-6 sm:py-5 ${
        align === 'top' ? 'sm:items-start' : 'sm:items-center'
      }`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[13.5px] font-semibold leading-tight text-foreground">
          {label}
        </p>
        {description ? (
          <div className="text-[12.5px] leading-relaxed text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
      <div className="shrink-0 sm:max-w-[60%]">{control}</div>
    </div>
  )
}

/** Fine print under a section — security reassurance, legal-ish. */
export function SettingsFootnote({
  icon,
  children,
}: {
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground/80">
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </p>
  )
}
