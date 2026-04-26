import Link from 'next/link'
import { Fragment } from 'react'
import { notFound, redirect } from 'next/navigation'
import {
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Inbox,
  Sparkles,
  Wand2,
} from 'lucide-react'

import { NewContentTabs } from '@/components/content/new-content-tabs'
import { SmartImportBox } from '@/components/content/smart-import-box'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

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

const PIPELINE_STEPS = [
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
] as const

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
    <div className="mx-auto w-full max-w-4xl space-y-10 p-4 sm:p-8">
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
              'radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0) 60%)',
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
      </section>

      {/* ── Pipeline preview ─ horizontal connector flow ───────── */}
      <section className="space-y-4">
        <header className="space-y-0.5">
          <p
            className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85"
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            <span aria-hidden className="inline-block h-px w-5 bg-primary/40" />
            02 · Pipeline
          </p>
          <h2
            className="text-[18px] font-bold tracking-tight text-foreground sm:text-[20px]"
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            What runs after you hit Import.
          </h2>
        </header>

        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch sm:gap-2">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon
            const isReady = step.estimate === 'Ready'
            return (
              <Fragment key={step.label}>
                <li
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-4"
                  style={{
                    boxShadow:
                      '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 12px 32px -22px rgba(42,26,61,0.2)',
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-primary"
                      style={{
                        background:
                          'linear-gradient(140deg, rgba(124,58,237,0.16) 0%, rgba(124,58,237,0.06) 100%)',
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className="text-[10.5px] font-bold tabular-nums tracking-[0.18em] text-primary/70"
                      style={{
                        fontFamily:
                          'var(--font-inter-tight), var(--font-inter), sans-serif',
                      }}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums ${
                        isReady
                          ? 'bg-emerald-500/[0.12] text-emerald-700'
                          : 'border border-border/60 bg-background text-muted-foreground'
                      }`}
                      style={
                        isReady
                          ? undefined
                          : {
                              fontFamily:
                                'var(--font-jetbrains-mono), monospace',
                            }
                      }
                    >
                      {isReady ? (
                        <>
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Ready
                        </>
                      ) : (
                        step.estimate
                      )}
                    </span>
                  </div>
                  <p
                    className="mt-3 text-[14px] font-bold tracking-tight text-foreground"
                    style={{
                      fontFamily:
                        'var(--font-inter-tight), var(--font-inter), sans-serif',
                    }}
                  >
                    {step.label}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </li>
                {i < PIPELINE_STEPS.length - 1 ? (
                  <li
                    aria-hidden
                    className="hidden items-center justify-center sm:flex"
                  >
                    <Connector />
                  </li>
                ) : null}
              </Fragment>
            )
          })}
        </ol>
      </section>

      {/* ── Other sources — designer-grade card, not afterthought ── */}
      <section className="space-y-3">
        <header className="space-y-0.5">
          <p
            className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85"
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            <span aria-hidden className="inline-block h-px w-5 bg-primary/40" />
            03 · Other sources
          </p>
          <h2
            className="text-[18px] font-bold tracking-tight text-foreground sm:text-[20px]"
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            Upload, record, or auto-pull a podcast.
          </h2>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            For files on your device, a one-take browser recording, or
            keeping a podcast feed in sync.
          </p>
        </header>

        <details
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card open:bg-card"
          style={{
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 10px 24px -16px rgba(42,26,61,0.18)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
          />
          <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors hover:bg-primary/[0.025] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground/85 transition-colors group-hover:border-primary/30 group-hover:text-primary group-open:border-primary/35 group-open:bg-primary/[0.08] group-open:text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-[13.5px] font-bold tracking-tight text-foreground"
                style={{
                  fontFamily:
                    'var(--font-inter-tight), var(--font-inter), sans-serif',
                }}
              >
                Pick a specific source
              </p>
              <p className="mt-0.5 truncate text-[12px] leading-relaxed text-muted-foreground">
                Video upload · audio recording · YouTube · web link · plain
                text · podcast RSS.
              </p>
            </div>
            <span className="hidden items-center gap-1 sm:inline-flex">
              {['Upload', 'Record', 'RSS'].map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-open:rotate-90 group-open:text-primary" />
          </summary>
          <div className="border-t border-border/55 px-5 py-5">
            <NewContentTabs workspaceId={params.id} hasOpenAiKey={hasOpenAiKey} />
          </div>
        </details>
      </section>
    </div>
  )
}

function Connector() {
  // Hairline arrow that bridges two pipeline cards. Dashed gradient
  // line + a small arrow head — reads as flow rather than three
  // disconnected islands.
  return (
    <div className="flex h-full w-8 items-center justify-center">
      <svg width="32" height="20" viewBox="0 0 32 20" fill="none" aria-hidden>
        <line
          x1="0"
          y1="10"
          x2="22"
          y2="10"
          stroke="url(#cf-conn-grad)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
        <path
          d="M22 5 L30 10 L22 15"
          stroke="rgba(124,58,237,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <defs>
          <linearGradient id="cf-conn-grad" x1="0" y1="0" x2="32" y2="0">
            <stop offset="0%" stopColor="rgba(124,58,237,0.15)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0.7)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
