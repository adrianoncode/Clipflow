import type { ReactNode } from 'react'

/**
 * Designer-level settings primitives. Reads like a polished SaaS
 * console (Linear / Vercel / Stripe) — not a developer data-sheet.
 *
 *   <SettingsSection index="01" title="Identity" hint="…">
 *     <SettingsRow label="Email" description="…" control={…} />
 *     <SettingsRow label="Display name" … />
 *   </SettingsSection>
 *
 * Section header pairs an optional violet-tinted ordinal ("01") with
 * the title in sans-display and a one-line hint. The card body has a
 * layered shadow + a 1px primary highlight on the top edge so it
 * reads as lifted off the canvas instead of pasted on.
 */

export function SettingsSection({
  index,
  title,
  hint,
  icon,
  children,
  /** Optional right-aligned slot in the section header (e.g. a "View all" link). */
  action,
}: {
  /** Two-character ordinal shown as a violet eyebrow (e.g. "01", "02"). */
  index?: string
  title: string
  hint?: string
  /** Optional small Lucide icon rendered next to the title. */
  icon?: ReactNode
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {index ? (
            <p
              className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/75"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              <span className="inline-block h-px w-5 bg-primary/40" />
              {index}
              <span className="text-primary/30">·</span>
              <span className="text-muted-foreground/70">section</span>
            </p>
          ) : null}
          <div className="flex items-center gap-2.5">
            {icon ? (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/[0.09] text-primary">
                {icon}
              </span>
            ) : null}
            <h2
              className="text-[20px] font-bold leading-tight tracking-tight text-foreground sm:text-[22px]"
              style={{ fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif' }}
            >
              {title}
            </h2>
          </div>
          {hint ? (
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      <div
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-card [&>*+*]:border-t [&>*+*]:border-border/60"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(15,15,15,0.04), 0 12px 32px -18px rgba(15,15,15,0.18)',
        }}
      >
        {/* Hairline primary highlight on the top edge — adds the
            faintest premium edge-light without tinting the whole card. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        />
        {children}
      </div>
    </section>
  )
}

export function SettingsRow({
  label,
  description,
  control,
  icon,
  align = 'center',
}: {
  /** Sentence-case label, primary foreground, semibold. */
  label: string
  /** Plain-language description / current value. */
  description?: ReactNode
  /** Interactive piece on the right (button, input, link). */
  control: ReactNode
  /** Optional small Lucide icon used as a left-side visual anchor. */
  icon?: ReactNode
  /** Align the control vertically — top for taller controls. */
  align?: 'top' | 'center'
}) {
  return (
    <div
      className={`group relative flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-primary/[0.025] sm:flex-row sm:gap-6 sm:px-6 sm:py-5 ${
        align === 'top' ? 'sm:items-start' : 'sm:items-center'
      }`}
    >
      {/* Hairline primary accent on hover, fades in from the left edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {icon ? (
        <span
          className={`hidden shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground/80 transition-colors group-hover:border-primary/30 group-hover:text-primary sm:inline-flex ${
            align === 'top' ? 'mt-0.5' : ''
          }`}
          style={{ width: 32, height: 32 }}
        >
          {icon}
        </span>
      ) : null}

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
