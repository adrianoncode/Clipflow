/**
 * Small reusable detail primitives that give the landing page its
 * non-generic texture. Each of these is intentionally lightweight —
 * they're meant to be composed throughout the page, not stand alone.
 */

interface SectionBadgeProps {
  /** Two-digit index shown as mono-font number, e.g. "01" */
  number: string
  /** Short label after the bullet, e.g. "How it works". */
  label: string
  className?: string
}

/**
 * Section eyebrow rendered as "01 · How it works" — numbers walk the
 * viewer through the page like chapters in a book. Distinctive vs. the
 * standard "FEATURES" label every SaaS site uses.
 */
export function SectionBadge({ number, label, className = '' }: SectionBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="font-mono text-xs font-medium text-zinc-400">{number}</span>
      <span className="h-px w-6 bg-violet-300" />
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
        {label}
      </span>
    </div>
  )
}

/**
 * Four tiny "+" marks at each corner of a relative-positioned parent.
 * Evokes architectural / engineering drawings — signals "this is a
 * designed artifact" rather than a random div.
 */
export function CornerPlus({ color = 'text-violet-400' }: { color?: string }) {
  return (
    <>
      {[
        'left-0 top-0',
        'right-0 top-0',
        'left-0 bottom-0',
        'right-0 bottom-0',
      ].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`pointer-events-none absolute ${pos} ${color}`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="opacity-60"
            style={{
              transform: pos.includes('left') && pos.includes('top')
                ? 'translate(-5px, -5px)'
                : pos.includes('right') && pos.includes('top')
                  ? 'translate(5px, -5px)'
                  : pos.includes('left') && pos.includes('bottom')
                    ? 'translate(-5px, 5px)'
                    : 'translate(5px, 5px)',
            }}
          >
            <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </span>
      ))}
    </>
  )
}

/**
 * Horizontal hairline divider with a gradient fade — sits between major
 * sections when a background color change isn't enough separation.
 */
export function HairlineDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`mx-auto max-w-7xl px-6 ${className}`}>
      <div className="hairline" />
    </div>
  )
}

/**
 * Tiny uppercase corner tag used on cards (e.g. "NEW", "BETA", "CORE").
 * Rendered absolute-positioned — the parent must be relative.
 */
export function CornerTag({
  children,
  position = 'tr',
}: {
  children: React.ReactNode
  position?: 'tl' | 'tr' | 'bl' | 'br'
}) {
  const positionClass =
    position === 'tl'
      ? 'left-4 top-4'
      : position === 'tr'
        ? 'right-4 top-4'
        : position === 'bl'
          ? 'left-4 bottom-4'
          : 'right-4 bottom-4'
  return (
    <span
      className={`absolute ${positionClass} z-10 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-violet-700 shadow-sm ring-1 ring-violet-100`}
    >
      {children}
    </span>
  )
}

/**
 * Data-point label, e.g. "+28s avg generation". Small, compact, used
 * inside feature cards for a "real-data" feel.
 */
export function DataLabel({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className="inline-flex items-baseline gap-1.5 rounded-md bg-zinc-50 px-2 py-1 text-xs">
      <span className="font-mono font-bold text-violet-700">{value}</span>
      <span className="text-zinc-500">{label}</span>
    </div>
  )
}
