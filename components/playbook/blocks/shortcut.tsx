import { Command } from 'lucide-react'

/**
 * Rendered keyboard-shortcut reminder. Shows key caps + label in a
 * compact inline chip. Used for docs-y "to do X faster, press ⌘K"
 * moments.
 */
export function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3.5 py-3"
      style={{
        background: 'var(--lv2-bg-2)',
        border: '1px solid var(--lv2-border)',
      }}
    >
      <Command className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--lv2-muted)' }} />
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={`${i}-${k}`} className="flex items-center gap-1">
            <kbd
              className="lv2-mono inline-flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-[11px] font-bold"
              style={{
                background: 'var(--lv2-card)',
                border: '1px solid var(--lv2-border)',
                color: 'var(--lv2-fg)',
                boxShadow: '0 1px 0 rgba(24,21,17,.06)',
              }}
            >
              {k}
            </kbd>
            {i < keys.length - 1 ? (
              <span style={{ color: 'var(--lv2-muted)' }}>+</span>
            ) : null}
          </span>
        ))}
      </div>
      <span
        className="text-[13px]"
        style={{ color: 'var(--lv2-fg-soft)' }}
      >
        {label}
      </span>
    </div>
  )
}
