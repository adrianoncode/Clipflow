'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  User,
  Users,
  Building2,
  Check,
} from 'lucide-react'

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

const AUDIENCES: Audience[] = [
  {
    id: 'creator',
    tabLabel: 'Creator',
    icon: User,
    eyebrow: 'For solo creators',
    headline: 'Ship a week of content before your coffee cools.',
    subline:
      'One long-form upload becomes 4 platform-native drafts with hooks tuned for each algorithm. Keep your voice, drop the copy-paste.',
    benefits: [
      'Brand voice training on your own writing',
      'AI Ghostwriter for scripts, hooks, CTAs',
      'Virality scoring before you post',
      'Real MP4 rendering with captions + B-roll',
    ],
    ctaLabel: 'Start creating',
  },
  {
    id: 'team',
    tabLabel: 'Team',
    icon: Users,
    eyebrow: 'For content teams',
    headline: 'Your whole team writes in one voice.',
    subline:
      'Shared brand voice, persona and approval pipeline. Reviewers can comment without a login — no more Slack threads hunting for the latest draft.',
    benefits: [
      'Workspace members with roles',
      'Draft → Review → Approved pipeline',
      'Client review portal (no login needed)',
      'Shared AI keys, shared usage caps',
    ],
    ctaLabel: 'Start a team workspace',
  },
  {
    id: 'agency',
    tabLabel: 'Agency',
    icon: Building2,
    eyebrow: 'For agencies',
    headline: 'One platform. Every client. Zero AI markup.',
    subline:
      'Separate workspace per client, white-label review links, and BYOK so your margin stays yours. API access for custom workflows.',
    benefits: [
      'Unlimited client workspaces',
      'White-label review portals',
      'BYOK — AI at cost, no platform markup',
      'API access + webhooks for custom automation',
    ],
    ctaLabel: 'Run your agency on Clipflow',
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            Built for every creator
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
            Pick your lane.
          </h2>
          <p className="mt-4 text-lg text-zinc-500">
            Same platform — completely different stories for solo creators, teams,
            and agencies.
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
