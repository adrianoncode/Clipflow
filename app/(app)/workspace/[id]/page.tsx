import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Wand2,
} from 'lucide-react'

import { ContentListWithSearch } from '@/components/content/content-list-with-search'
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: '#7c7468', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            {workspace.name} · Content
          </p>
          <h1
            className="text-[44px] leading-[1.02]"
            style={{
              fontFamily: 'var(--font-instrument-serif), serif',
              letterSpacing: '-.015em',
              color: '#2A1A3D',
            }}
          >
            Your library.
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7c7468' }}>
            {items.length === 0
              ? 'Import your first video to get started.'
              : `${items.length} item${items.length === 1 ? '' : 's'} · ${workspace.name}`}
          </p>
        </div>

        {canCreate && (
          <Link
            href={`/workspace/${params.id}/content/new`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            Import video
          </Link>
        )}
      </div>

      {/* ── Status stats strip ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200/50 bg-emerald-50/30 px-4 py-3 transition-all hover:shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-mono text-xl font-bold tabular-nums leading-none">{readyCount}</p>
              <p className="text-[11px] font-medium text-emerald-700/70">Ready</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-amber-200/50 bg-amber-50/30 px-4 py-3 transition-all hover:shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
              <Loader2 className={`h-4 w-4 text-amber-600 ${processingCount > 0 ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="font-mono text-xl font-bold tabular-nums leading-none">{processingCount}</p>
              <p className="text-[11px] font-medium text-amber-700/70">Processing</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-red-200/50 bg-red-50/30 px-4 py-3 transition-all hover:shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="font-mono text-xl font-bold tabular-nums leading-none">{failedCount}</p>
              <p className="text-[11px] font-medium text-red-600/70">Failed</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Workflow shortcuts — show when user has ready content ── */}
      {readyCount > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {firstReady && (
            <Link
              href={`/workspace/${params.id}/content/${firstReady.id}/outputs`}
              className="group flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/[0.06]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Wand2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-primary">Generate drafts</p>
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
