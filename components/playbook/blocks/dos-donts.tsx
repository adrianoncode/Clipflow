import { Check, X } from 'lucide-react'

/**
 * Two-column do / don't grid. Use sparingly — the visual weight is
 * strong so it should be reserved for genuinely actionable contrasts.
 */
export function DosDonts({ dos, donts }: { dos: string[]; donts: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Column
        label="Do"
        items={dos}
        tone="good"
        icon={<Check className="h-3 w-3" strokeWidth={3} />}
      />
      <Column
        label="Don't"
        items={donts}
        tone="bad"
        icon={<X className="h-3 w-3" strokeWidth={3} />}
      />
    </div>
  )
}

function Column({
  label,
  items,
  tone,
  icon,
}: {
  label: string
  items: string[]
  tone: 'good' | 'bad'
  icon: React.ReactNode
}) {
  const styles =
    tone === 'good'
      ? {
          labelBg: 'var(--lv2-primary-soft)',
          labelFg: 'var(--lv2-primary)',
          itemIconBg: 'var(--lv2-primary)',
          itemIconFg: 'var(--lv2-accent)',
        }
      : {
          labelBg: '#F8E3E0',
          labelFg: '#9B2018',
          itemIconBg: '#9B2018',
          itemIconFg: '#ffffff',
        }

  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: 'var(--lv2-card)',
        border: '1px solid var(--lv2-border)',
      }}
    >
      <span
        className="lv2-mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ background: styles.labelBg, color: styles.labelFg }}
      >
        {label}
      </span>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
              style={{ background: styles.itemIconBg, color: styles.itemIconFg }}
              aria-hidden
            >
              {icon}
            </span>
            <span style={{ color: 'var(--lv2-fg)' }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
