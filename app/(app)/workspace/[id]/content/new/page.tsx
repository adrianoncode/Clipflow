import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ChevronRight,
  CheckCircle2,
  FileText,
  Film,
  GitBranch,
  Globe,
  Mic2,
  Rss,
  Sparkles,
  Upload,
  Youtube,
} from 'lucide-react'

import { NewContentTabs } from '@/components/content/new-content-tabs'
import { SmartImportBox } from '@/components/content/smart-import-box'
import { PageHeader } from '@/components/ui/page-header'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = {
  title: 'Import a recording · Clipflow',
}

/**
 * Whisper transcription can take up to ~3 minutes on a 25MB file. Ask
 * Vercel for 300s headroom so the platform doesn't cut off the Server
 * Action mid-request. Vercel Hobby is capped at 60s — upgrade to Pro for
 * the full window. Locally there's no ceiling.
 */
export const maxDuration = 300

interface NewContentPageProps {
  params: { id: string }
}

const SOURCE_TYPES: Array<{
  icon: typeof Youtube
  label: string
  hint: string
  iconBg: string
  iconFg: string
}> = [
  { icon: Youtube, label: 'YouTube', hint: 'Paste a video URL', iconBg: 'bg-red-100', iconFg: 'text-red-600' },
  { icon: Upload, label: 'Upload', hint: 'MP4, MOV, MP3, WAV', iconBg: 'bg-violet-100', iconFg: 'text-violet-600' },
  { icon: Globe, label: 'Web link', hint: 'Loom, Riverside, blog post', iconBg: 'bg-blue-100', iconFg: 'text-blue-600' },
  { icon: FileText, label: 'Text', hint: 'Paste a script or transcript', iconBg: 'bg-zinc-100', iconFg: 'text-zinc-600' },
  { icon: Mic2, label: 'Audio recording', hint: 'Record straight in the browser', iconBg: 'bg-amber-100', iconFg: 'text-amber-600' },
  { icon: Rss, label: 'Podcast RSS', hint: 'Latest episode auto-imports', iconBg: 'bg-orange-100', iconFg: 'text-orange-600' },
]

const PIPELINE_STEPS: Array<{
  icon: typeof Sparkles
  label: string
  body: string
  estimate: string
}> = [
  {
    icon: Sparkles,
    label: 'Transcribe',
    body: 'Word-level timestamps. Auto-detects language.',
    estimate: '~30 s',
  },
  {
    icon: GitBranch,
    label: 'Slice into drafts',
    body: 'Hooks, captions, and platform-formatted posts.',
    estimate: '~45 s',
  },
  {
    icon: CheckCircle2,
    label: 'Land in your library',
    body: 'Status pill flips green when ready for review.',
    estimate: 'Ready',
  },
]

export default async function NewContentPage({ params }: NewContentPageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)

  if (!workspace) notFound()

  if (workspace.role === 'viewer' || workspace.role === 'client') {
    redirect(`/workspace/${params.id}`)
  }

  let hasOpenAiKey = true
  if (workspace.role === 'owner') {
    const keys = await getAiKeys(params.id)
    hasOpenAiKey = keys.some((k) => k.provider === 'openai')
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-4 sm:p-8">
      {/* ── Breadcrumb ── */}
      <nav
        className="flex flex-wrap items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link
          href={`/workspace/${params.id}`}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          {workspace.name}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <Link
          href={`/workspace/${params.id}`}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          Content
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <span className="rounded-md px-1.5 py-0.5 font-semibold text-foreground">New</span>
      </nav>

      <PageHeader
        eyebrow="Import"
        title="Drop a recording in."
        description="Paste a link, upload a file, or record straight in the browser. Clipflow figures out the format and starts processing — no per-source forms."
      />

      {/* ── Smart-import primary path ── */}
      <section className="space-y-3">
        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <SmartImportBox workspaceId={params.id} hasOpenAiKey={hasOpenAiKey} />
        </div>

        {/* ── Source-type chips: visual hint of what's accepted ── */}
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70"
          >
            We handle
          </span>
          {SOURCE_TYPES.slice(0, 4).map((s) => {
            const Icon = s.icon
            return (
              <span
                key={s.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground"
                title={s.hint}
              >
                <Icon className="h-3 w-3 opacity-70" />
                {s.label}
              </span>
            )
          })}
        </div>
      </section>

      {/* ── What happens next — preview the pipeline so users build trust ── */}
      <section className="space-y-3">
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
        >
          What happens next
        </p>
        <ol className="grid gap-2 sm:grid-cols-3">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <li
                key={i}
                className="rounded-2xl border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span
                    className="font-mono text-[10px] font-bold tabular-nums text-muted-foreground"
                  >
                    0{i + 1}
                  </span>
                  <span
                    className="ml-auto rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground"
                  >
                    {step.estimate}
                  </span>
                </div>
                <p className="mt-3 text-[13px] font-bold text-foreground">{step.label}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ── Advanced source pickers (upload widget, audio recorder, RSS) ── */}
      <details className="group rounded-2xl border bg-card">
        <summary
          className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-[13px] font-semibold text-foreground [&::-webkit-details-marker]:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <Film className="h-3.5 w-3.5 text-muted-foreground" />
            Other sources
            <span className="font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-muted-foreground">
              upload · record · RSS
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
        </summary>
        <div className="border-t px-5 py-5">
          <NewContentTabs workspaceId={params.id} hasOpenAiKey={hasOpenAiKey} />
        </div>
      </details>
    </div>
  )
}
