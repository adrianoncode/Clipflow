import type { Metadata } from 'next'
import { Zap, Video, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Changelog — Clipflow',
  description: 'Latest updates, features, and improvements to Clipflow.',
}

const ENTRIES = [
  {
    date: 'April 13, 2026',
    version: 'v1.0',
    title: 'Launch Day',
    icon: Zap,
    color: '#F4D93D',
    bg: '#0F0F0F',
    changes: [
      { type: 'new' as const, text: 'One video → 4 platform-native posts (TikTok, Reels, Shorts, LinkedIn)' },
      { type: 'new' as const, text: 'Video rendering via Shotstack — burn captions, assemble B-Roll, smart reframe to 9:16' },
      { type: 'new' as const, text: 'Brand Voice — upload 5 samples and the AI writes in your tone' },
      { type: 'new' as const, text: 'A/B Hook Testing — generate 3 hook variants with different psychological triggers, pick the winner' },
      { type: 'new' as const, text: 'Creator Research — find creators by niche across YouTube, TikTok, Instagram' },
      { type: 'new' as const, text: 'Integrations — Slack, Discord notifications + Notion, Google Sheets, LinkedIn via Composio' },
      { type: 'new' as const, text: 'Upload-Post — one key, auto-publish to all 4 social platforms on a schedule' },
      { type: 'new' as const, text: 'AI Avatar (D-ID) + Voice Dubbing (ElevenLabs) on the Studio plan' },
    ],
  },
  {
    date: 'April 12, 2026',
    version: 'v0.9',
    title: 'Video & UI Overhaul',
    icon: Video,
    color: '#0F0F0F',
    bg: '#EDE6F5',
    changes: [
      { type: 'new' as const, text: 'Shotstack video rendering integration' },
      { type: 'new' as const, text: 'Raycast-inspired dark theme across the entire app' },
      { type: 'improved' as const, text: 'Landing page redesigned with product mockup, comparison table, and interactive hero' },
      { type: 'improved' as const, text: 'Onboarding flow with premium UI, icons, and trust signals' },
      { type: 'fixed' as const, text: 'Dark mode now defaults correctly regardless of OS setting' },
    ],
  },
  {
    date: 'April 11, 2026',
    version: 'v0.8',
    title: 'Core Platform',
    icon: Sparkles,
    color: '#0F6B4D',
    bg: '#E6F4EE',
    changes: [
      { type: 'new' as const, text: '4-platform draft generation — TikTok, Reels, Shorts, LinkedIn' },
      { type: 'new' as const, text: 'BYOK — bring your own OpenAI, Anthropic, or Google key' },
      { type: 'new' as const, text: 'Brand voice settings with tone, keywords, and example hooks' },
      { type: 'new' as const, text: 'Client review links — shareable without account' },
      { type: 'new' as const, text: 'Content pipeline with drag states (draft → review → approved → exported)' },
      { type: 'new' as const, text: 'Animated subtitles with word-level Whisper timestamps' },
    ],
  },
]

const TYPE_BADGE: Record<'new' | 'improved' | 'fixed', { label: string; bg: string; fg: string }> = {
  new: { label: 'New', bg: '#E6F4EE', fg: '#0F6B4D' },
  improved: { label: 'Improved', bg: '#EDE6F5', fg: '#0F0F0F' },
  fixed: { label: 'Fixed', bg: '#FBEDD9', fg: '#A0530B' },
}

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="lv2L-eyebrow">What&apos;s new · Clipflow</p>
      <h1
        className="lv2L-display text-[56px] leading-[1.02]"
        style={{ color: '#0F0F0F' }}
      >
        Changelog.
      </h1>
      <p className="mt-3 text-[15px]" style={{ color: '#3a342c' }}>
        New features, improvements, and fixes. Tightest summary, shipped dates.
      </p>

      <div className="mt-14 space-y-14">
        {ENTRIES.map((entry, idx) => {
          const Icon = entry.icon
          return (
            <div key={entry.version} className="relative">
              {/* Version header */}
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: entry.bg }}
                >
                  <Icon className="h-4 w-4" style={{ color: entry.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className="lv2L-display text-[26px] leading-[1]"
                      style={{ color: '#0F0F0F' }}
                    >
                      {entry.title}
                    </h2>
                    <span
                      className="lv2L-mono rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: '#ECE5D8',
                        color: '#3a342c',
                        letterSpacing: '.1em',
                      }}
                    >
                      {entry.version}
                    </span>
                  </div>
                  <p
                    className="lv2L-mono mt-1 text-[10.5px]"
                    style={{ color: '#7c7468', letterSpacing: '.15em' }}
                  >
                    {entry.date.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Changes list — timeline rail in plum, fades at the bottom of the last group */}
              <ul
                className="ml-5 space-y-3 border-l pl-6"
                style={{
                  borderColor: idx === ENTRIES.length - 1 ? 'transparent' : '#E5DDCE',
                }}
              >
                {entry.changes.map((change, i) => {
                  const badge = TYPE_BADGE[change.type]
                  return (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="lv2L-mono mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                        style={{
                          background: badge.bg,
                          color: badge.fg,
                          letterSpacing: '.08em',
                        }}
                      >
                        {badge.label.toUpperCase()}
                      </span>
                      <span className="text-[14px]" style={{ color: '#3a342c' }}>
                        {change.text}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
