import { Check } from 'lucide-react'

/**
 * Decorative checklist. Items are non-interactive (no real toggle
 * state); the visual affordance is intentional — it reads as a list
 * you could mentally tick off, not as a form.
 */
export function Checklist({ title, items }: { title?: string; items: string[] }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: 'var(--lv2-card)',
        border: '1px solid var(--lv2-border)',
      }}
    >
      {title ? (
        <p
          className="lv2-mono mb-3 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--lv2-muted)' }}
        >
          {title}
        </p>
      ) : null}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed">
            <span
              className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border"
              style={{
                background: 'var(--lv2-bg-2)',
                borderColor: 'var(--lv2-border)',
                color: 'var(--lv2-primary)',
              }}
              aria-hidden
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            <span style={{ color: 'var(--lv2-fg)' }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
