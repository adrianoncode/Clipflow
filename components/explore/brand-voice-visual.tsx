'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Side-by-side before/after of the Brand Voice effect. One static
 * "generic AI" caption on the left, one on-brand caption on the right.
 * The right side cycles through two or three voices to demonstrate
 * adaptability.
 */
export function BrandVoiceVisual() {
  const reduce = useReducedMotion()
  const voices = [
    {
      name: 'Your voice',
      description: 'First-person, contractions, specific',
      caption:
        "Nobody told me the algorithm doesn't care about effort — only about the first 3 seconds. Here's the fix that actually works:",
    },
    {
      name: 'Coach voice',
      description: 'Framework-heavy, contrarian, action-ending',
      caption:
        'The 3-second rule: if your first line doesn\u2019t earn the next seven, you\u2019re posting trivia. Rewrite every opener against this today.',
    },
    {
      name: 'Podcaster voice',
      description: 'Quote-forward, em-dashes, soft CTA',
      caption:
        '"The algorithm doesn\u2019t care how much work you put in — only about the hook." — Sarah, on this week\u2019s episode. Full conversation in the link.',
    },
  ]
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduce) return
    const t = window.setInterval(() => setI((v) => (v + 1) % voices.length), 3200)
    return () => window.clearInterval(t)
  }, [reduce, voices.length])

  const current = voices[i]!

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Generic AI side — static */}
      <div
        className="flex flex-col gap-2 rounded-xl p-4"
        style={{
          background: 'var(--lv2-bg-2)',
          border: '1px solid var(--lv2-border)',
        }}
      >
        <span
          className="lv2-mono text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--lv2-muted)' }}
        >
          Generic AI caption
        </span>
        <p className="text-[13px] leading-snug" style={{ color: 'var(--lv2-muted)' }}>
          Boost your engagement with these actionable tips that will help
          you grow your audience! What are your thoughts? 💪🚀
        </p>
        <p
          className="lv2-mono mt-auto text-[9px] uppercase tracking-wider"
          style={{ color: 'var(--lv2-muted)', opacity: 0.7 }}
        >
          Reads like every other tool
        </p>
      </div>

      {/* Brand-voice side — rotates */}
      <div
        className="flex flex-col gap-2 rounded-xl p-4 transition-colors duration-500"
        style={{
          background: 'var(--lv2-primary)',
          color: 'var(--lv2-accent)',
          border: '1px solid var(--lv2-primary)',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="lv2-mono text-[10px] uppercase tracking-wider"
            style={{ color: 'rgba(214,255,62,.55)' }}
          >
            Brand-voice output
          </span>
          <span
            className="lv2-mono rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{
              background: 'rgba(214,255,62,.15)',
              color: 'var(--lv2-accent)',
            }}
          >
            {current.name}
          </span>
        </div>
        <p className="text-[13px] leading-snug" style={{ color: 'rgba(255,255,255,.9)' }}>
          {current.caption}
        </p>
        <p
          className="lv2-mono mt-auto text-[9px] uppercase tracking-wider"
          style={{ color: 'rgba(214,255,62,.55)' }}
        >
          {current.description}
        </p>
      </div>
    </div>
  )
}
