import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Inbox, Wand2 } from 'lucide-react'

import { SmartImportBox } from '@/components/content/smart-import-box'
import { CreateStepper } from '@/components/create/create-stepper'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getLatestContentId } from '@/lib/content/get-content-items'

export const metadata = {
  title: 'Import a recording · Clipflow',
}

/**
 * Whisper transcription can take up to ~3 minutes on a 25MB file. Ask
 * Vercel for 300s headroom so the platform doesn't cut off the Server
 * Action mid-request. Vercel Hobby is capped at 60s — upgrade to Pro
 * for the full window. Locally there's no ceiling.
 */
export const maxDuration = 300

interface NewContentPageProps {
  params: { id: string }
}

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

  const latestContentId = await getLatestContentId(params.id)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 p-4 sm:p-8">
      <CreateStepper
        workspaceId={params.id}
        activeStep={1}
        contentId={latestContentId ?? undefined}
      />
      {/* ── Breadcrumb ── modern sans, hairline slashes */}
      <nav
        className="flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground/80"
        aria-label="Breadcrumb"
      >
        <Link
          href={`/workspace/${params.id}`}
          className="rounded-md px-1.5 py-0.5 font-medium transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          {workspace.name}
        </Link>
        <span aria-hidden className="select-none text-muted-foreground/40">/</span>
        <Link
          href={`/workspace/${params.id}`}
          className="rounded-md px-1.5 py-0.5 font-medium transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          Content
        </Link>
        <span aria-hidden className="select-none text-muted-foreground/40">/</span>
        <span
          className="rounded-md px-1.5 py-0.5 font-semibold tracking-tight text-foreground"
          style={{
            fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          New
        </span>
      </nav>

      {/* ── Hero ── visual anchor + editorial title */}
      <header
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-5 py-6 sm:px-7 sm:py-7"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(42,26,61,0.05), 0 18px 38px -22px rgba(42,26,61,0.22)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(42,26,61,0.18) 0%, rgba(42,26,61,0) 60%)',
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <span
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white sm:h-16 sm:w-16"
            style={{
              background:
                'linear-gradient(140deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.18) inset, 0 10px 24px -12px rgba(42,26,61,0.55)',
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
            <Inbox className="relative h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.7} />
          </span>

          <div className="min-w-0">
            <p
              className="mb-1 inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              <span aria-hidden className="inline-block h-px w-5 bg-primary/40" />
              {workspace.name} · Import
            </p>
            <h1
              className="text-[28px] leading-[1.05] sm:text-[34px]"
              style={{
                fontFamily: 'var(--font-instrument-serif), serif',
                letterSpacing: '-.015em',
                color: '#2A1A3D',
              }}
            >
              Drop a recording in.
            </h1>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
              Paste a link, upload a file, or record straight in the browser.
              Clipflow figures out the format and starts processing — no
              per-source forms.
            </p>
          </div>
        </div>
      </header>

      {/* ── Smart import primary path ───────────────────────────── */}
      <section className="space-y-3">
        <header className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p
              className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              <span aria-hidden className="inline-block h-px w-5 bg-primary/40" />
              01 · Smart import
            </p>
            <h2
              className="text-[18px] font-bold tracking-tight text-foreground sm:text-[20px]"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              Drop the link — we read the format.
            </h2>
          </div>
          <span
            className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700 sm:inline-flex"
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            <Wand2 className="h-3 w-3" />
            Auto-detected
          </span>
        </header>

        <SmartImportBox workspaceId={params.id} hasOpenAiKey={hasOpenAiKey} />
        {/* Pipeline-Preview removed — duplicated by the global CreateStepper.
            Other-Sources moved into the SmartImportBox's "Other sources →"
            drawer (Record + RSS). NewContentTabs is gone. */}
      </section>
    </div>
  )
}

