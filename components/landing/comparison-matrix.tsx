'use client'

import { Check, Minus } from 'lucide-react'

/**
 * Comparison matrix against the two dominant incumbents — OpusClip
 * (clip-finder leader) and Klap (cheaper video-repurposing play).
 *
 * Positioning strategy: we don't play the "we're cheaper" game
 * head-on; we frame the real differentiators (BYOK pricing, Brand
 * Voice, Agency features, White-label review) so the prospect sees
 * Clipflow as a superset of what they're leaving behind.
 *
 * Each row is a capability the prospect actually feels — no
 * marketing-speak bullet points like "AI-powered" or "cloud-native".
 * If we can't defend the claim honestly, the row doesn't ship.
 */
export function ComparisonMatrix() {
  const rows: Array<{
    label: string
    detail?: string
    clipflow: boolean | string
    opus: boolean | string
    klap: boolean | string
    highlight?: boolean
  }> = [
    {
      label: 'Clip Finder with virality scoring',
      detail: 'Ranks clips by hook strength, not just length.',
      clipflow: true,
      opus: true,
      klap: true,
    },
    {
      label: 'Writes in your brand voice',
      detail: 'Reads your past posts, matches tone + vocabulary + hooks.',
      clipflow: true,
      opus: false,
      klap: false,
      highlight: true,
    },
    {
      label: 'Brand Kit on every render',
      detail: 'Logo, color, custom font, intro/outro — automatic.',
      clipflow: true,
      opus: 'Logo only',
      klap: false,
      highlight: true,
    },
    {
      label: 'Scheduler with auto-publish',
      detail: 'TikTok, Instagram, YouTube, LinkedIn on a calendar.',
      clipflow: true,
      opus: 'Via Zapier',
      klap: false,
    },
    {
      label: 'A/B test hooks before publish',
      detail: 'Three variants, pick the winner, track performance.',
      clipflow: true,
      opus: false,
      klap: false,
      highlight: true,
    },
    {
      label: 'White-label client review links',
      detail: 'Your agency brand on the client-facing surface, not theirs.',
      clipflow: true,
      opus: false,
      klap: false,
      highlight: true,
    },
    {
      label: 'Unlimited client workspaces',
      detail: 'One account, separate context per client.',
      clipflow: true,
      opus: '1 workspace',
      klap: '1 workspace',
    },
    {
      label: 'Team seats with roles',
      detail: 'Owner / editor / reviewer / client — audit log included.',
      clipflow: true,
      opus: '+$25/seat',
      klap: false,
    },
    {
      label: 'BYOK — you pay your AI provider at cost',
      detail: 'No markup on OpenAI / Anthropic / Google tokens.',
      clipflow: true,
      opus: false,
      klap: false,
      highlight: true,
    },
    {
      label: 'Creator research across platforms',
      detail: 'What\u2019s working in your niche, aggregated.',
      clipflow: true,
      opus: false,
      klap: false,
    },
  ]

  return (
    <section
      className="mx-auto max-w-[1240px] px-6 py-24"
      style={{ borderTop: '1px solid var(--lv2-border)' }}
    >
      <div className="lv2-reveal mb-12 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="lv2-mono-label mb-3">Switching from?</p>
          <h2
            className="lv2-display max-w-[640px] text-[44px] leading-[1.02] sm:text-[56px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            What OpusClip and Klap don&apos;t do.
          </h2>
        </div>
        <p className="max-w-[340px] text-[15px]" style={{ color: 'var(--lv2-muted)' }}>
          Honest side-by-side. If a row isn\u2019t checked for us, it\u2019s not in this
          matrix — we only list what we ship.
        </p>
      </div>

      <div
        className="lv2-reveal overflow-hidden rounded-[20px]"
        style={{
          border: '1px solid var(--lv2-border)',
          background: 'var(--lv2-card)',
        }}
      >
        {/* Column header row */}
        <div
          className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr] items-center border-b text-[12.5px] font-bold sm:grid-cols-[2fr_0.7fr_0.7fr_0.7fr]"
          style={{ borderColor: 'var(--lv2-border)' }}
        >
          <div className="px-5 py-4">
            <span className="lv2-mono-label">Capability</span>
          </div>
          <div
            className="relative flex items-center justify-center gap-1.5 px-3 py-4 text-center"
            style={{
              background: 'var(--lv2-primary)',
              color: 'var(--lv2-accent)',
            }}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-md"
              style={{ background: 'var(--lv2-accent)' }}
            >
              <span
                className="block h-2 w-2 rounded-[2px]"
                style={{ background: 'var(--lv2-primary)' }}
              />
            </span>
            <span className="text-[13px]">Clipflow</span>
          </div>
          <div
            className="flex items-center justify-center px-3 py-4 text-center"
            style={{ color: 'var(--lv2-muted)' }}
          >
            OpusClip
          </div>
          <div
            className="flex items-center justify-center px-3 py-4 text-center"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Klap
          </div>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr] items-stretch border-b text-[13px] transition-colors last:border-b-0 hover:bg-black/[.02] sm:grid-cols-[2fr_0.7fr_0.7fr_0.7fr]"
            style={{ borderColor: 'var(--lv2-border)' }}
          >
            <div className="flex flex-col justify-center px-5 py-4">
              <p
                className="font-semibold leading-snug"
                style={{
                  color: row.highlight ? 'var(--lv2-primary)' : 'var(--lv2-fg)',
                }}
              >
                {row.label}
                {row.highlight && (
                  <span
                    className="lv2-mono ml-2 align-middle"
                    style={{
                      background: 'var(--lv2-accent)',
                      color: 'var(--lv2-accent-ink)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                    }}
                  >
                    ONLY CLIPFLOW
                  </span>
                )}
              </p>
              {row.detail ? (
                <p
                  className="mt-0.5 text-[11.5px] leading-snug"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  {row.detail}
                </p>
              ) : null}
            </div>
            <CellValue value={row.clipflow} strong />
            <CellValue value={row.opus} />
            <CellValue value={row.klap} />
            {/* Alternating row tint for scanability */}
            <style jsx>{`
              div[data-row-i='${i}']:nth-child(even) {
                background: rgba(0, 0, 0, 0.015);
              }
            `}</style>
          </div>
        ))}
      </div>

      <p
        className="lv2-mono mt-6 text-center text-[10.5px]"
        style={{ color: 'var(--lv2-muted)', letterSpacing: '0.04em' }}
      >
        PUBLIC PRICING + DOCS OF EACH TOOL · APRIL 2026 · UPDATES WELCOME
      </p>
    </section>
  )
}

function CellValue({ value, strong }: { value: boolean | string; strong?: boolean }) {
  const isYes = value === true
  const isNo = value === false

  return (
    <div
      className="flex items-center justify-center border-l px-3 py-4 text-center"
      style={{
        borderColor: 'var(--lv2-border)',
        background: strong ? 'rgba(214,255,62,.06)' : 'transparent',
      }}
    >
      {isYes ? (
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: strong ? 'var(--lv2-primary)' : 'var(--lv2-primary-soft)',
            color: strong ? 'var(--lv2-accent)' : 'var(--lv2-primary)',
          }}
          aria-label="Yes"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      ) : isNo ? (
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: 'var(--lv2-bg-2)', color: 'var(--lv2-muted)' }}
          aria-label="No"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      ) : (
        <span
          className="text-[11px] font-semibold leading-tight"
          style={{ color: 'var(--lv2-muted)' }}
        >
          {value}
        </span>
      )}
    </div>
  )
}
