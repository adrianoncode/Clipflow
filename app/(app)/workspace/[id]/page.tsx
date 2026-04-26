import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileVideo,
  Loader2,
  Plus,
  Wand2,
} from 'lucide-react'

import { ContentListWithSearch } from '@/components/content/content-list-with-search'
import { SettingsHero } from '@/components/settings/settings-hero'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getContentItems } from '@/lib/content/get-content-items'
import { findDuplicateIds } from '@/lib/content/find-duplicates'

interface WorkspaceHomePageProps {
  params: { id: string }
  searchParams: { page?: string }
}

const PAGE_SIZE = 50

export default async function WorkspaceHomePage({ params, searchParams }: WorkspaceHomePageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  // Parallelize the workspace-list lookup and the content-items fetch.
  // getWorkspaces is cached via React.cache so downstream callers in
  // the layout share the same result. The items fetch doesn't depend
  // on membership — RLS hides rows for non-members anyway.
  const [workspaces, items] = await Promise.all([
    getWorkspaces(),
    getContentItems(params.id, { limit: PAGE_SIZE, offset }),
  ])

  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()
  const canCreate = workspace.role === 'owner' || workspace.role === 'editor'
  const duplicateIds = findDuplicateIds(items)

  // Quick stats
  const readyCount = items.filter((i) => i.status === 'ready').length
  const processingCount = items.filter(
    (i) => i.status === 'processing' || i.status === 'uploading',
  ).length
  const failedCount = items.filter((i) => i.status === 'failed').length

  // Find first ready item without outputs for a CTA
  const firstReady = items.find((i) => i.status === 'ready')

  const heroBody =
    items.length === 0
      ? 'Every recording you import lands here as a row with a status pill — ready to slice into platform drafts.'
      : `${items.length} recording${items.length === 1 ? '' : 's'} in this workspace · ${readyCount} ready, ${processingCount} processing.`

  return (
    <div className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-8">
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
            <FileVideo className="relative h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.7} />
          </span>
        }
        eyebrow={`${workspace.name} · Library`}
        title="Your library."
        body={heroBody}
        action={
          canCreate ? (
            <Link
              href={`/workspace/${params.id}/content/new`}
              className="group inline-flex h-10 items-center gap-1.5 rounded-xl bg-foreground px-4 text-[13px] font-bold tracking-tight text-background shadow-sm shadow-foreground/[0.18] transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-foreground/[0.28]"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Import recording
            </Link>
          ) : null
        }
      />

      {/* ── Status stats strip ── compact pills, only when content exists */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          <StatChip
            tone="ready"
            value={readyCount}
            label="Ready"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatChip
            tone="processing"
            value={processingCount}
            label="Processing"
            icon={
              <Loader2
                className={`h-4 w-4 ${processingCount > 0 ? 'animate-spin' : ''}`}
              />
            }
          />
          <StatChip
            tone="failed"
            value={failedCount}
            label="Failed"
            icon={<AlertCircle className="h-4 w-4" />}
          />
        </div>
      )}

      {/* ── Workflow shortcuts — show when user has ready content ── */}
      {readyCount > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {firstReady && (
            <Link
              href={`/workspace/${params.id}/content/${firstReady.id}/highlights`}
              className="group flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/[0.06]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Wand2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-primary">Find viral moments</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {firstReady.title ?? 'Untitled'}
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/40 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <Link
            href={`/workspace/${params.id}/pipeline`}
            className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold">Review pipeline</p>
              <p className="text-[10px] text-muted-foreground">Approve &amp; publish</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}

      {/* ── Content list ── */}
      <ContentListWithSearch
        items={items}
        workspaceId={params.id}
        duplicateIds={duplicateIds}
      />

      {/* ── Pagination ── */}
      {(items.length === PAGE_SIZE || page > 1) && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={`/workspace/${params.id}?page=${page - 1}`}
              className="rounded-xl border border-border/50 px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-px hover:border-primary/20 hover:text-foreground hover:shadow-sm"
            >
              ← Previous
            </Link>
          )}
          <span className="text-xs tabular-nums text-muted-foreground/60">
            Page {page}
          </span>
          {items.length === PAGE_SIZE && (
            <Link
              href={`/workspace/${params.id}?page=${page + 1}`}
              className="rounded-xl border border-border/50 px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-px hover:border-primary/20 hover:text-foreground hover:shadow-sm"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function StatChip({
  tone,
  value,
  label,
  icon,
}: {
  tone: 'ready' | 'processing' | 'failed'
  value: number
  label: string
  icon: React.ReactNode
}) {
  const palette = {
    ready: {
      iconBg: 'bg-emerald-500/[0.12] text-emerald-700',
      labelColor: 'text-emerald-700/80',
      ring: 'border-emerald-500/20',
      glow: 'rgba(16,185,129,0.10)',
    },
    processing: {
      iconBg: 'bg-amber-500/[0.12] text-amber-700',
      labelColor: 'text-amber-700/80',
      ring: 'border-amber-500/25',
      glow: 'rgba(245,158,11,0.10)',
    },
    failed: {
      iconBg: 'bg-red-500/[0.12] text-red-600',
      labelColor: 'text-red-600/80',
      ring: 'border-red-500/25',
      glow: 'rgba(239,68,68,0.10)',
    },
  }[tone]
  return (
    <div
      className={`relative flex items-center gap-3 overflow-hidden rounded-xl border ${palette.ring} bg-card px-4 py-3 transition-all`}
      style={{
        boxShadow: `0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 8px 18px -14px ${palette.glow}`,
      }}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${palette.iconBg}`}
      >
        {icon}
      </span>
      <div>
        <p
          className="font-mono text-[20px] font-bold tabular-nums leading-none text-foreground"
          style={{ fontFamily: 'var(--font-inter-tight), sans-serif' }}
        >
          {value}
        </p>
        <p
          className={`mt-1 text-[10.5px] font-bold uppercase tracking-[0.18em] ${palette.labelColor}`}
          style={{
            fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          {label}
        </p>
      </div>
    </div>
  )
}
