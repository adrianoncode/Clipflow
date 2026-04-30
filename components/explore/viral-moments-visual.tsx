'use client'

import { Sparkles, Clapperboard } from 'lucide-react'

/**
 * Visual slot for the Viral Moments feature detail page. Renders a
 * mock Highlights-list card grid that mirrors what the in-app
 * `/workspace/[id]/content/[id]/highlights` page actually shows —
 * three draft cards stacked vertically with score, hook, reason,
 * and a "Render" CTA. Fully static, zero JS, respects lv2 tokens.
 *
 * Mirrors the real UI deliberately so marketing pages stay honest
 * as the feature evolves.
 */
export function ViralMomentsVisual() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'var(--lv2-bg-2, #F3EDE3)',
        border: '1px solid var(--lv2-border, rgba(0,0,0,.08))',
      }}
    >
      {/* Header chip */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'var(--lv2-primary, #0F0F0F)' }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--lv2-accent, #D6FF3E)' }} />
        </span>
        <p
          className="font-bold text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--lv2-muted, #5f5850)' }}
        >
          AI picked · sorted by virality
        </p>
      </div>

      {/* Three clip cards */}
      <div className="space-y-2.5">
        {CLIPS.map((c) => (
          <article
            key={c.hook}
            className="rounded-xl border p-3"
            style={{
              background: 'var(--lv2-card, #FFFDF8)',
              borderColor: 'var(--lv2-border, rgba(0,0,0,.08))',
            }}
          >
            {/* Score + timing row */}
            <div className="mb-1.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums"
                style={{
                  background: c.score >= 80 ? '#ECFDF5' : c.score >= 60 ? '#FFFBEB' : 'var(--lv2-bg-2)',
                  borderColor: c.score >= 80 ? '#BBF7D0' : c.score >= 60 ? '#FDE68A' : 'rgba(0,0,0,.08)',
                  color: c.score >= 80 ? '#047857' : c.score >= 60 ? '#92400E' : 'var(--lv2-muted)',
                }}
              >
                {c.score}
                <span className="opacity-50">/100</span>
              </span>
              <span
                className="font-bold text-[10px] uppercase tracking-[0.08em]"
                style={{ color: 'var(--lv2-muted, #5f5850)' }}
              >
                {c.timing}
              </span>
            </div>

            {/* Hook */}
            <p
              className="text-[13px] font-bold leading-snug"
              style={{ color: 'var(--lv2-fg, #181511)' }}
            >
              {c.hook}
            </p>

            {/* Reason */}
            <p
              className="mt-1 text-[11px] leading-relaxed"
              style={{ color: 'var(--lv2-muted, #5f5850)' }}
            >
              {c.reason}
            </p>

            {/* Render CTA */}
            <div className="mt-2.5 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10.5px] font-bold"
                style={{
                  background: 'var(--lv2-primary, #0F0F0F)',
                  color: 'var(--lv2-accent, #D6FF3E)',
                }}
              >
                <Clapperboard className="h-3 w-3" aria-hidden />
                Render
              </span>
              <span
                className="font-mono text-[10px]"
                style={{ color: 'var(--lv2-muted, #5f5850)' }}
              >
                \u2248 60s · Shotstack
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

const CLIPS = [
  {
    score: 91,
    timing: '0:58 \u2013 1:42 \u00b7 44s',
    hook: 'Nobody tells you this',
    reason:
      'Vulnerable admission right out of the gate, pattern-interrupt tone. Ends on a clean line, not mid-thought.',
  },
  {
    score: 78,
    timing: '12:04 \u2013 12:48 \u00b7 44s',
    hook: 'I used to charge $50/h. Here\u2019s why I stopped.',
    reason:
      'Numeric specificity + story setup. Strong curiosity gap hook, quotable takeaway within the first 8 seconds.',
  },
  {
    score: 64,
    timing: '28:15 \u2013 28:47 \u00b7 32s',
    hook: 'The calendar test my agency runs every week',
    reason:
      'Useful tactic framed as a ritual. Scores lower than the top two on emotional peak but reads well as a how-to.',
  },
]
