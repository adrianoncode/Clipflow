import { Check, X } from 'lucide-react'

/**
 * Good / bad example pair. Used for showing concrete Tone-field
 * copy, hook templates, caption alternatives — anywhere the reader
 * benefits from seeing right vs wrong side-by-side.
 *
 * The `bad` side is optional; when missing, we just show the good
 * example with a subtle "example" marker.
 */
export function ExampleBox({
  label,
  good,
  bad,
}: {
  label: string
  good: string
  bad?: string
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: 'var(--lv2-card)',
        border: '1px solid var(--lv2-border)',
      }}
    >
      <p
        className="lv2-mono mb-3 text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--lv2-muted)' }}
      >
        {label}
      </p>
      <div className="space-y-3">
        <ExampleRow
          tone="good"
          text={good}
          icon={<Check className="h-2.5 w-2.5" strokeWidth={3} />}
        />
        {bad ? (
          <ExampleRow
            tone="bad"
            text={bad}
            icon={<X className="h-2.5 w-2.5" strokeWidth={3} />}
          />
        ) : null}
      </div>
    </div>
  )
}

function ExampleRow({
  tone,
  text,
  icon,
}: {
  tone: 'good' | 'bad'
  text: string
  icon: React.ReactNode
}) {
  const style =
    tone === 'good'
      ? {
          iconBg: 'var(--lv2-primary)',
          iconFg: 'var(--lv2-accent)',
          barColor: 'var(--lv2-primary)',
          textColor: 'var(--lv2-fg)',
        }
      : {
          iconBg: '#9B2018',
          iconFg: '#ffffff',
          barColor: '#9B2018',
          textColor: 'var(--lv2-fg-soft)',
        }

  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        style={{ background: style.iconBg, color: style.iconFg }}
        aria-hidden
      >
        {icon}
      </span>
      <p
        className="flex-1 rounded-lg border-l-2 bg-[var(--lv2-bg-2)] px-3 py-2 text-[13.5px] leading-relaxed"
        style={{
          borderLeftColor: style.barColor,
          color: style.textColor,
        }}
      >
        {text}
      </p>
    </div>
  )
}
