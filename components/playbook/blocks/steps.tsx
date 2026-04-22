import type { GuideStep } from '@/lib/landing/playbook-types'
import { Callout } from './callout'

/**
 * Numbered step-by-step. Used for walkthroughs where order matters.
 * Each step can carry an optional tip that renders as a compact
 * sub-callout — lets writers attach mechanical details to a step
 * without breaking the numbered flow.
 */
export function Steps({ items }: { items: GuideStep[] }) {
  return (
    <ol className="space-y-4">
      {items.map((step, i) => (
        <li
          key={`${i}-${step.title}`}
          className="flex gap-4 rounded-2xl p-4 sm:p-5"
          style={{
            background: 'var(--lv2-card)',
            border: '1px solid var(--lv2-border)',
          }}
        >
          <span
            className="lv2-mono flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold"
            style={{
              background: 'var(--lv2-primary)',
              color: 'var(--lv2-accent)',
              letterSpacing: 0,
            }}
            aria-hidden
          >
            {(i + 1).toString().padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[15px] font-bold leading-snug"
              style={{ color: 'var(--lv2-fg)' }}
            >
              {step.title}
            </p>
            <p
              className="mt-1.5 text-[14px] leading-relaxed"
              style={{ color: 'var(--lv2-fg-soft)' }}
            >
              {step.body}
            </p>
            {step.tip ? (
              <div className="mt-3">
                <Callout variant="tip" body={step.tip} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
