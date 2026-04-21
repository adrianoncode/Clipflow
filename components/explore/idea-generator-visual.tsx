'use client'

import { Clock, Sparkles } from 'lucide-react'

/**
 * Static preview of the Idea Generator output — three example idea
 * cards rendered at reading size so the detail page visitor sees
 * exactly what the feature produces.
 */
export function IdeaGeneratorVisual() {
  const ideas = [
    {
      title: 'Why most creators plateau at 10K followers',
      hook: 'It\u2019s not the algorithm. It\u2019s the assumption you made at 5K.',
      platforms: ['TikTok', 'Shorts'],
      len: 3,
      badge: 'Contrarian hook',
    },
    {
      title: 'The content cadence I stole from podcasters',
      hook: 'One recording. Three posts. Zero extra effort.',
      platforms: ['LinkedIn', 'Instagram'],
      len: 5,
      badge: 'Framework',
    },
    {
      title: 'I tested 3 hooks on the same clip. Here\u2019s what won.',
      hook: 'Same content. Three different openers. 4x difference in reach.',
      platforms: ['TikTok', 'Shorts', 'Instagram'],
      len: 2,
      badge: 'Data-driven',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles
          className="h-3.5 w-3.5"
          style={{ color: 'var(--lv2-primary)' }}
        />
        <span
          className="lv2-mono text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--lv2-muted)' }}
        >
          Topic: building an indie SaaS audience
        </span>
      </div>
      <div className="grid gap-2.5">
        {ideas.map((i) => (
          <div
            key={i.title}
            className="rounded-xl p-3"
            style={{
              background: 'var(--lv2-bg-2)',
              border: '1px solid var(--lv2-border)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[13px] font-bold leading-snug"
                style={{ color: 'var(--lv2-fg)' }}
              >
                {i.title}
              </p>
              <span
                className="lv2-mono shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{
                  background: 'var(--lv2-accent)',
                  color: 'var(--lv2-accent-ink)',
                }}
              >
                {i.badge}
              </span>
            </div>
            <p
              className="mt-1.5 rounded-md px-2 py-1 text-[11px] italic"
              style={{
                background: 'var(--lv2-primary-soft)',
                color: 'var(--lv2-primary)',
              }}
            >
              &ldquo;{i.hook}&rdquo;
            </p>
            <div
              className="mt-2 flex items-center justify-between text-[10px]"
              style={{ color: 'var(--lv2-muted)' }}
            >
              <div className="flex gap-1">
                {i.platforms.map((p) => (
                  <span
                    key={p}
                    className="lv2-mono rounded-full px-1.5 py-0.5 font-bold uppercase tracking-wide"
                    style={{ background: 'var(--lv2-muted-2)' }}
                  >
                    {p}
                  </span>
                ))}
              </div>
              <span className="lv2-mono flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {i.len}m
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
