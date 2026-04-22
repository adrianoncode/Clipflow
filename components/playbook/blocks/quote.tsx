/**
 * Display quote — large serif pullquote for emphasis moments inside
 * a guide. Use very sparingly; too many quotes in a guide flatten
 * the typographic hierarchy.
 */
export function Quote({ text, attribution }: { text: string; attribution?: string }) {
  return (
    <blockquote
      className="relative rounded-2xl p-6 sm:p-8"
      style={{
        background: 'var(--lv2-bg-2)',
        border: '1px solid var(--lv2-border)',
      }}
    >
      <span
        aria-hidden
        className="lv2-display pointer-events-none absolute -left-1 -top-4 text-[72px] opacity-20"
        style={{ color: 'var(--lv2-primary)' }}
      >
        &ldquo;
      </span>
      <p
        className="lv2-display relative z-10 text-[22px] leading-[1.3] sm:text-[26px]"
        style={{ color: 'var(--lv2-fg)' }}
      >
        {text}
      </p>
      {attribution ? (
        <p
          className="lv2-mono mt-4 text-[10.5px] uppercase tracking-[0.12em]"
          style={{ color: 'var(--lv2-muted)' }}
        >
          — {attribution}
        </p>
      ) : null}
    </blockquote>
  )
}
