'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  User,
  Building2,
  Check,
} from 'lucide-react'

import { SectionBadge } from '@/components/landing/detail-primitives'

interface Audience {
  id: string
  tabLabel: string
  icon: React.ComponentType<{ className?: string }>
  eyebrow: string
  headline: string
  subline: string
  benefits: string[]
  ctaLabel: string
}

// Two ICPs = two tabs. Each tab tells a different story using ONLY
// features the matching plan actually unlocks. If you remove a feature
// from the product, remove it here too — dead promises kill trust.
const AUDIENCES: Audience[] = [
  {
    id: 'creator',
    tabLabel: "I'm a creator",
    icon: User,
    eyebrow: 'For indie creators',
    headline: 'Ship a week of content before your coffee cools.',
    subline:
      'One long-form video becomes four platform-native posts — TikTok, Reels, Shorts, LinkedIn — each with hooks tuned for that feed. Approve, schedule, walk away.',
    benefits: [
      'Turn any video into 4 platform-specific posts',
      'A/B test hooks before you publish',
      'Schedule + auto-publish to all 4 platforms',
      'Creator research across YouTube / TikTok / Instagram',
    ],
    ctaLabel: 'Start creating',
  },
  {
    id: 'agency',
    tabLabel: 'I manage brands',
    icon: Building2,
    eyebrow: 'For agencies & social-media managers',
    headline: 'One cockpit. Every client. No tab gymnastics.',
    subline:
      "A workspace per client keeps voices, approvals, and schedules cleanly separated. Share review links so clients can approve without logging in — and everything stays white-label.",
    benefits: [
      'Unlimited client workspaces with their own brand voice',
      'Team seats with owner / editor / reviewer roles',
      'White-label client review links — no Clipflow logo',
      'AI avatars + auto-dub to scale creative across clients',
    ],
    ctaLabel: 'Run your studio on Clipflow',
  },
]

interface AudienceTabsProps {
  signupHref: string
}

/**
 * Three-state audience switcher between the workflow and features
 * sections. Lets visitors self-identify — the rest of the page can
 * then be read through their own lens. Keeps the same CTA but changes
 * the value prop entirely per audience.
 */
export function AudienceTabs({ signupHref }: AudienceTabsProps) {
  const [activeId, setActiveId] = useState<string>(AUDIENCES[0]!.id)
  const active = AUDIENCES.find((a) => a.id === activeId) ?? AUDIENCES[0]!

  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <SectionBadge number="02" label="Built for two kinds of people" className="justify-center" />
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
            Pick <span className="italic text-violet-600">your lane.</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-500">
            Same platform — a very different home screen for solo creators and
            for the agencies running them.
          </p>
        </div>

        {/* Tab strip */}
        <div className="mt-12 flex justify-center">
          <div
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50/80 p-1 shadow-sm"
            role="tablist"
          >
            {AUDIENCES.map((a) => {
              const isActive = a.id === activeId
              const Icon = a.icon
              return (
                <button
                  key={a.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(a.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {a.tabLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="mt-14">
          <div
            key={active.id}
            className="animate-fade-up grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
                {active.eyebrow}
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-4xl md:text-5xl">
                {active.headline}
              </h3>
              <p className="mt-5 text-lg leading-relaxed text-zinc-600">
                {active.subline}
              </p>
              <Link
                href={signupHref}
                className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition-all hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20"
              >
                {active.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <ul className="grid gap-3 self-center">
              {active.benefits.map((b, i) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                  style={{
                    animation: 'fade-up 0.5s ease-out both',
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] leading-snug text-zinc-800">
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
