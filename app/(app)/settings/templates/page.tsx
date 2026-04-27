import { redirect } from 'next/navigation'
import { LayoutTemplate, Sparkles, Wand2 } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getActiveNiche } from '@/lib/niche/get-active-niche'
import { getWorkspaceTemplates } from '@/lib/templates/get-templates'
import { SettingsHero } from '@/components/settings/settings-hero'
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
    <div className="mx-auto w-full max-w-4xl space-y-9 p-4 sm:p-6">
      <SettingsHero
        visual={
          <span
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white sm:h-16 sm:w-16"
            style={{
              background:
                'linear-gradient(140deg, #7C3AED 0%, #4B0FB8 60%, #2A1A3D 100%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.18) inset, 0 10px 24px -12px rgba(75,15,184,0.55)',
            }}
            aria-hidden
          >
            <span
              className="pointer-events-none absolute inset-1 rounded-[14px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
              }}
            />
            <LayoutTemplate
              className="relative h-6 w-6 sm:h-7 sm:w-7"
              strokeWidth={1.7}
            />
          </span>
        }
        eyebrow={`${workspace.name} · Templates`}
        title="Draft templates."
        body="Tune the prompts that shape every AI draft. Built-ins ship sane defaults — layer a niche on top, override the format only when you need it."
      />

      {/* ── 01 · Platform templates (read-only built-ins) ───────── */}
      <section className="space-y-4">
        <SectionHeader
          index="01"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          title="Platform templates"
          hint="4 channels · built-in defaults · the structure every draft starts from"
        />
        <PlatformTemplatesGrid />
      </section>

      {/* ── 02 · Niche preset ───────────────────────────────────── */}
      <NichePicker workspaceId={workspaceId} initialNiche={activeNiche} />

      {/* ── 03 · Custom templates ──────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          index="03"
          icon={<Wand2 className="h-3.5 w-3.5" />}
          title="Your overrides"
          hint="Custom platform/niche combos that override the built-ins for this workspace"
        />
        <TemplatesClient workspaceId={workspaceId} templates={templates} />
      </section>
    </div>
  )
}

function SectionHeader({
  index,
  icon,
  title,
  hint,
}: {
  index: string
  icon: React.ReactNode
  title: string
  hint?: string
}) {
  return (
    <header className="space-y-1">
      <p
        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/75"
        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
      >
        <span aria-hidden className="inline-block h-px w-5 bg-primary/40" />
        {index}
        <span className="text-primary/30">·</span>
        <span className="text-muted-foreground/70">section</span>
      </p>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/[0.09] text-primary">
          {icon}
        </span>
        <h2
          className="text-[20px] font-bold leading-tight tracking-tight text-foreground sm:text-[22px]"
          style={{ fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif' }}
        >
          {title}
        </h2>
      </div>
      {hint ? (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </header>
  )
}
