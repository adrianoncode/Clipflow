import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getActiveNiche } from '@/lib/niche/get-active-niche'
import { getWorkspaceTemplates } from '@/lib/templates/get-templates'
import { PageHeading } from '@/components/workspace/page-heading'
import { PlatformTemplatesGrid } from '@/components/templates/platform-templates-grid'
import { NichePicker } from './niche-picker'
import { TemplatesClient } from './templates-client'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Draft Templates' }

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
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-6">
      <PageHeading
        eyebrow={`${workspace.name} · Templates`}
        title="Draft templates."
        body="Tune the prompts that shape every AI draft. Built-ins ship sane defaults — layer a niche on top, override the format only when you need it."
      />

      {/* ── 01 · Platform templates (read-only built-ins) ───────── */}
      <section className="space-y-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="text-primary">01</span> · Platform templates
          <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/70">
            4 channels · built-in defaults
          </span>
        </p>
        <PlatformTemplatesGrid />
      </section>

      {/* ── 02 · Niche preset ───────────────────────────────────── */}
      <NichePicker workspaceId={workspaceId} initialNiche={activeNiche} />

      {/* ── 03 · Custom templates ──────────────────────────────── */}
      <TemplatesClient workspaceId={workspaceId} templates={templates} />
    </div>
  )
}
