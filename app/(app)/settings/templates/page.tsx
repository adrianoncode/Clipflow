import { redirect } from 'next/navigation'
import { LayoutTemplate } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getActiveNiche } from '@/lib/niche/get-active-niche'
import { getWorkspaceTemplates } from '@/lib/templates/get-templates'
import { PageHeading } from '@/components/workspace/page-heading'
import { NichePicker } from './niche-picker'
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

/* Niche presets now live in lib/niche/presets.ts — the NichePicker
   component loads them directly. */

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

  const [templates, activeNiche] = await Promise.all([
    getWorkspaceTemplates(workspaceId),
    getActiveNiche(workspaceId),
  ])

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#EDE6F5' }}
        >
          <LayoutTemplate className="h-4 w-4" style={{ color: '#2A1A3D' }} />
        </div>
        <PageHeading
          eyebrow="Settings · Templates"
          title="Draft templates."
          body="Customise the AI prompts used per platform. Built-ins ship sane defaults — override only the ones where your voice needs steering."
        />
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

      {/* Niche presets — interactive picker. Clicking a card persists
          the workspace's active niche; generation pipeline layers it
          on top of the platform template so output reads correct for
          the industry. */}
      <NichePicker workspaceId={workspaceId} initialNiche={activeNiche} />

      {/* Custom templates */}
      <TemplatesClient
        workspaceId={workspaceId}
        templates={templates}
      />
    </div>
  )
}
