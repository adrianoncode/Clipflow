import Link from 'next/link'
import type { Metadata } from 'next'
import { Zap, Video, Sparkles, Shield, Globe } from 'lucide-react'

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
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    changes: [
      { type: 'new' as const, text: '25+ AI tools — Content DNA, Viral Hooks, Script Coach, Carousel, Newsletter, and more' },
      { type: 'new' as const, text: 'Video rendering via Shotstack — burn captions, assemble B-Roll, clip videos, brand templates' },
      { type: 'new' as const, text: 'AI Persona — give the AI a name, backstory, expertise, and writing style' },
      { type: 'new' as const, text: 'One-Click Full Repurpose — 4 platform drafts + newsletter + carousel + chapters in parallel' },
      { type: 'new' as const, text: 'Trend-to-Content pipeline — Google Trends → AI script → content item in 1 click' },
      { type: 'new' as const, text: '24 integrations — Slack, Discord, WordPress, Beehiiv, Medium, Notion, Airtable, and more' },
      { type: 'new' as const, text: 'OAuth for TikTok, Instagram, LinkedIn, YouTube' },
      { type: 'new' as const, text: 'AI Voice Clone + Faceless Video Pipeline via ElevenLabs' },
    ],
  },
  {
    date: 'April 12, 2026',
    version: 'v0.9',
    title: 'Video & UI Overhaul',
    icon: Video,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
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
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
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

const TYPE_BADGE = {
  new: { label: 'New', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  improved: { label: 'Improved', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  fixed: { label: 'Fixed', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
}

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Back to home</Link>

      <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
      <p className="mt-2 text-muted-foreground">New features, improvements, and fixes.</p>

      <div className="mt-12 space-y-12">
        {ENTRIES.map((entry) => (
          <div key={entry.version} className="relative">
            {/* Version header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${entry.bg}`}>
                <entry.icon className={`h-4 w-4 ${entry.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{entry.title}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{entry.version}</span>
                </div>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
            </div>

            {/* Changes list */}
            <ul className="ml-[18px] border-l-2 border-border/50 pl-6 space-y-2.5">
              {entry.changes.map((change, i) => {
                const badge = TYPE_BADGE[change.type]
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <span className="text-sm text-muted-foreground">{change.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
