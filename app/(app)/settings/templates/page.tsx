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

      {/* Built-in templates */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Built-in Templates
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

      {/* Custom templates */}
      <TemplatesClient
        workspaceId={workspaceId}
        templates={templates}
      />
    </div>
  )
}
