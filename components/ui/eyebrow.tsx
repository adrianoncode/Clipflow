import type { ReactNode } from 'react'

/**
 * Eyebrow — the small caps label that sits above section titles and
 * group headers. Replaces the grey-mono-caps pattern that was
 * sprinkled across 30+ files and read as boilerplate everywhere.
 *
 *   <Eyebrow>Section · subhead</Eyebrow>
 *   <Eyebrow tone="muted">Optional</Eyebrow>
 *   <Eyebrow tone="primary" leadingHairline>Active</Eyebrow>
 *
 * Default: Inter-Tight tracking-[0.22em] caps in primary/85, with a
 * 4×1 px hairline to the left. Same look used on settings hero,
 * library hero, research hero — keeps the system one-voiced.
 */

interface EyebrowProps {
  children: ReactNode
  /** Color treatment — default is the violet primary accent. "muted"
   *  is a soft variant for sub-eyebrows that need to be present but
   *  not pull focus. */
  tone?: 'primary' | 'muted'
  /** Render the leading hairline bar. Default true. */
  leadingHairline?: boolean
  className?: string
  /** Render as a different element (default: <p>). Useful for inline
   *  contexts where a paragraph would break layout. */
  as?: 'p' | 'span' | 'div'
}

export function Eyebrow({
  children,
  tone = 'primary',
  leadingHairline = true,
  className = '',
  as = 'p',
}: EyebrowProps) {
  const Tag = as
  const colorClass =
    tone === 'primary' ? 'text-primary/85' : 'text-muted-foreground/80'
  const hairlineClass =
    tone === 'primary' ? 'bg-primary/40' : 'bg-muted-foreground/40'

  return (
    <Tag
      className={`inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] ${colorClass} ${className}`}
      style={{
        fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
      }}
    >
      {leadingHairline ? (
        <span aria-hidden className={`inline-block h-px w-5 ${hairlineClass}`} />
      ) : null}
      {children}
    </Tag>
  )
}
