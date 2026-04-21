import { redirect } from 'next/navigation'
import { LayoutTemplate } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspaceTemplates } from '@/lib/templates/get-templates'
import { TemplatesClient } from './templates-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Draft Templates',
}

/* ── Platform templates — one per output channel ─────────────────── */
const BUILT_IN_TEMPLATES = [
  {
    name: 'TikTok',
    platform: 'tiktok',
    description: 'Hook-heavy vertical short-form. 15-60s, energetic, trending audio.',
    structureHint: 'Hook → Value Delivery → CTA + Hashtags',
  },
  {
    name: 'Instagram Reels',
    platform: 'instagram_reels',
    description: 'Aesthetic short-form, caption-driven with visual storytelling.',
    structureHint: 'Visual Hook → Story → Caption with emoji + Hashtags',
  },
  {
    name: 'YouTube Shorts',
    platform: 'youtube_shorts',
    description: 'Up to 60s, educational tone OK, search-optimized.',
    structureHint: 'Hook → Main Point → CTA to long-form',
  },
  {
    name: 'LinkedIn',
    platform: 'linkedin',
    description: 'Text-first professional post, thought leadership angle.',
    structureHint: 'Bold first line → Story/Insight → Takeaway → Engagement question',
  },
]

/* ── Niche presets — shared across all platforms, tuned to industry
      conventions. Applied on top of the platform template so a
      Coach-TikTok draft reads like a coach, while a SaaS-LinkedIn
      draft reads like a founder. Shipping as seed data; users on the
      Studio plan can later override per client workspace. ─────────── */
const NICHE_PRESETS = [
  {
    id: 'creator',
    name: 'Creator / Influencer',
    description:
      'Personal voice, audience-first tone. Hooks that open loops and promise transformation.',
    emoji: '🎬',
    tone:
      'First-person, relatable, energetic. Use contractions and direct-address ("you"). Favor curiosity-gap openers over stat-drops.',
  },
  {
    id: 'podcaster',
    name: 'Podcaster',
    description:
      'Conversation-snippet format. Quote the host, surface a single insight, point back to the full episode.',
    emoji: '🎙️',
    tone:
      'Quote-forward. Use em-dashes for attribution. End with a soft CTA to the full episode rather than a sales ask.',
  },
  {
    id: 'coach',
    name: 'Coach / Consultant',
    description:
      'Frameworks and contrarian takes. Each post positions the coach as the expert with a point of view.',
    emoji: '🎯',
    tone:
      'Assertive, framework-heavy. Prefer numbered lists and "the thing nobody tells you" angles. End with a concrete action, not a question.',
  },
  {
    id: 'saas',
    name: 'SaaS / B2B founder',
    description:
      'Story-driven, lesson-led. Draws from actual building experience, not generic advice.',
    emoji: '💼',
    tone:
      'Second-person LinkedIn voice on LinkedIn, first-person narrative on shorts. Favor specific numbers and company names. Avoid buzzwords like "synergy" or "leverage".',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce / DTC',
    description:
      'Product-in-use, benefit-first, time-bound. Every post has a reason to act now.',
    emoji: '🛍️',
    tone:
      'Benefit-over-feature. Lead with a transformation, not the product name. Ship a soft discount or scarcity hook in the CTA when appropriate.',
  },
  {
    id: 'agency',
    name: 'Agency / Studio',
    description:
      'Client-case narratives and positioning. Builds credibility through specific work shown.',
    emoji: '🏢',
    tone:
      'Third-person narrator voice. Quote the client result, not the tool. Use industry language (CAC, ROAS, CTR) where the audience expects it.',
  },
] as const

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: { workspace?: string }
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspaces()
  const workspaceId = searchParams.workspace ?? workspaces.find((w) => w.role === 'owner')?.id

  if (!workspaceId) redirect('/dashboard')

  const workspace = workspaces.find((w) => w.id === workspaceId)
  if (!workspace) redirect('/dashboard')

  const templates = await getWorkspaceTemplates(workspaceId)

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100">
          <LayoutTemplate className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Draft Templates</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Customize the AI prompts used to generate content for each platform.
          </p>
        </div>
      </div>

      {/* Built-in platform templates */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Platform templates
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILT_IN_TEMPLATES.map((t) => (
            <div
              key={t.platform}
              className="rounded-md border bg-muted/20 p-3 space-y-1"
            >
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <p className="text-xs text-muted-foreground/70 font-mono">{t.structureHint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Niche presets — applied on top of the platform template.
          A Coach-TikTok draft combines the TikTok template with the
          Coach preset below so tone is industry-correct automatically. */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Niche presets
          </h2>
          <p className="text-[11px] text-muted-foreground/60">
            Applied on top of each platform template
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {NICHE_PRESETS.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-md border bg-muted/20 p-3"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-lg"
                aria-hidden
              >
                {n.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/80">
                  <span className="font-mono font-bold uppercase tracking-wider text-muted-foreground/60">
                    Tone:
                  </span>{' '}
                  {n.tone}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom templates */}
      <TemplatesClient
        workspaceId={workspaceId}
        templates={templates}
      />
    </div>
  )
}
