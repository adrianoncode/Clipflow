import { AlertCircle, Check, Info, Lightbulb, Sparkles } from 'lucide-react'

import type { CalloutVariant } from '@/lib/landing/playbook-types'

/**
 * Five-variant callout box. Each variant reads differently at a
 * glance — colour + icon + default label — so scan-readers can skim
 * a guide and still catch tips and warnings.
 *
 * - tip       → soft plum/lime, lightbulb, "Tip"
 * - pro       → filled plum, sparkles, "Pro tip"
 * - warning   → ochre, alert, "Heads up"
 * - example   → neutral card, check, "Example"
 * - info      → soft neutral, info, "Note"
 */
const VARIANTS: Record<
  CalloutVariant,
  {
    icon: typeof Info
    defaultTitle: string
    bg: string
    fg: string
    border: string
    iconBg: string
    iconColor: string
  }
> = {
  tip: {
    icon: Lightbulb,
    defaultTitle: 'Tip',
    bg: 'var(--lv2-card)',
    fg: 'var(--lv2-fg)',
    border: 'var(--lv2-primary-soft)',
    iconBg: 'var(--lv2-primary-soft)',
    iconColor: 'var(--lv2-primary)',
  },
  pro: {
    icon: Sparkles,
    defaultTitle: 'Pro tip',
    bg: 'var(--lv2-primary)',
    fg: 'var(--lv2-accent)',
    border: 'var(--lv2-primary)',
    iconBg: 'rgba(214,255,62,.15)',
    iconColor: 'var(--lv2-accent)',
  },
  warning: {
    icon: AlertCircle,
    defaultTitle: 'Heads up',
    bg: '#FBEDD9',
    fg: '#3a2905',
    border: '#F5DCB4',
    iconBg: '#F5DCB4',
    iconColor: '#A0530B',
  },
  example: {
    icon: Check,
    defaultTitle: 'Example',
    bg: 'var(--lv2-bg-2)',
    fg: 'var(--lv2-fg)',
    border: 'var(--lv2-border)',
    iconBg: 'var(--lv2-muted-2)',
    iconColor: 'var(--lv2-fg-soft)',
  },
  info: {
    icon: Info,
    defaultTitle: 'Note',
    bg: 'var(--lv2-card)',
    fg: 'var(--lv2-fg)',
    border: 'var(--lv2-border)',
    iconBg: 'var(--lv2-muted-2)',
    iconColor: 'var(--lv2-fg-soft)',
  },
}

export function Callout({
  variant,
  title,
  body,
}: {
  variant: CalloutVariant
  title?: string
  body: string
}) {
  const cfg = VARIANTS[variant]
  const Icon = cfg.icon
  const label = title ?? cfg.defaultTitle
  const isDark = variant === 'pro'

  return (
    <aside
      className="relative flex items-start gap-3 overflow-hidden rounded-2xl p-4 pl-5 sm:p-5 sm:pl-6"
      style={{
        background: cfg.bg,
        color: cfg.fg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {/* Saturated left rule — sells the variant at a glance */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: isDark ? 'var(--lv2-accent)' : cfg.iconColor }}
      />
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: cfg.iconBg, color: cfg.iconColor }}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="lv2-mono mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{
            color: isDark ? 'rgba(214,255,62,.78)' : cfg.iconColor,
          }}
        >
          {label}
        </p>
        <p
          className="text-[14px] leading-[1.6]"
          style={{ color: isDark ? 'rgba(255,255,255,.92)' : cfg.fg }}
        >
          {body}
        </p>
      </div>
    </aside>
  )
}
