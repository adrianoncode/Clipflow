import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Film,
  Link2,
  Loader2,
  Rss,
  Youtube,
} from 'lucide-react'

import {
  bucketRecentImports,
  type RecentImportsBucket,
} from '@/lib/content/recent-imports'
import type { ContentItemListRow } from '@/lib/content/get-content-items'
import type { ContentKind, ContentStatus } from '@/lib/supabase/types'
import { ProcessingTabTitle } from '@/components/content/processing-tab-title'
import { RecentImportsRealtime } from '@/components/content/recent-imports-realtime'

interface RecentImportsStripProps {
  workspaceId: string
  items: ContentItemListRow[]
}

/**
 * Live "Recent imports" strip for the Library page.
 *
 * Spec: project_create_step1_import.md + project_create_step2_process.md
 *
 * Visible only when there's actually something happening — either an
 * active import (uploading/processing) or a terminal (ready/failed)
 * that landed within the last 30 minutes. Otherwise null, so a quiet
 * Library doesn't show a permanent empty rail.
 *
 * Live updates come from RecentImportsRealtime — workspace-scoped
 * Supabase Realtime that fires router.refresh() on any change.
 */
export function RecentImportsStrip({
  workspaceId,
  items,
}: RecentImportsStripProps) {
  const bucket = bucketRecentImports(items)
  // The tab-title hook runs unconditionally so the ✓ flash on
  // last-item-completed fires even when the strip itself is hiding
  // (no active + no fresh-terminal → strip returns null below).
  const tabTitle = <ProcessingTabTitle items={items} />
  if (bucket.active.length === 0 && bucket.freshTerminal.length === 0) {
    return tabTitle
  }
  // Active first (most-recent at the top because items is already DESC),
  // then fresh-terminals below — they're a smaller "just landed" peek.
  const ordered = [...bucket.active, ...bucket.freshTerminal]
  const total = ordered.length

  return (
    <section
      aria-labelledby="recent-imports-heading"
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(15,15,15,0.04), 0 12px 28px -22px rgba(15,15,15,0.20)',
      }}
    >
      {tabTitle}
      <RecentImportsRealtime workspaceId={workspaceId} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />
      <header className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-5">
        <p
          id="recent-imports-heading"
          className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85"
          style={{
            fontFamily:
              'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          <span aria-hidden className="inline-block h-px w-4 bg-primary/40" />
          Recent imports
          <span
            className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary"
            aria-label={`${total} items`}
          >
            {total}
          </span>
        </p>
        {bucket.active.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </span>
            {bucket.active.length} live
          </span>
        ) : null}
      </header>
      <ol className="flex gap-2 overflow-x-auto px-4 pb-4 sm:px-5">
        {ordered.map((item) => (
          <li key={item.id} className="shrink-0">
            <RecentImportCard workspaceId={workspaceId} item={item} />
          </li>
        ))}
      </ol>
    </section>
  )
}

const KIND_ICON: Record<ContentKind, typeof Film> = {
  video: Film,
  text: FileText,
  youtube: Youtube,
  url: Link2,
  rss: Rss,
}

function RecentImportCard({
  workspaceId,
  item,
}: {
  workspaceId: string
  item: ContentItemListRow
}) {
  const KindIcon = KIND_ICON[item.kind] ?? Film
  const title = item.title?.trim() || 'Untitled'
  const tone = TONE_FOR_STATUS[item.status]

  return (
    <Link
      href={`/workspace/${workspaceId}/content/${item.id}`}
      className="group relative flex h-full w-[260px] items-center gap-3 rounded-xl border border-border/50 bg-background px-3 py-2.5 transition-all hover:-translate-y-px hover:border-border hover:bg-card sm:w-[300px]"
    >
      <span
        aria-hidden
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.iconBg}`}
      >
        <KindIcon className={`h-4 w-4 ${tone.iconColor}`} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">
          {title}
        </p>
        <StatusLine
          status={item.status}
          phase={item.processing_phase}
          progress={item.processing_progress}
        />
      </div>
    </Link>
  )
}

/**
 * Maps the optional sub-phase to a friendly label. Phases are advisory
 * — when missing, we fall back to the generic status label so legacy
 * rows from before the Slice 8 migration still render cleanly.
 */
function phaseLabel(phase: string | null): string | null {
  switch (phase) {
    case 'queued':
      return 'Queued'
    case 'uploading':
      return 'Uploading…'
    case 'detect':
      return 'Detecting language…'
    case 'transcribe':
      return 'Transcribing…'
    case 'index':
      return 'Indexing…'
    default:
      return null
  }
}

function StatusLine({
  status,
  phase,
  progress,
}: {
  status: ContentStatus
  phase: string | null
  progress: number | null
}) {
  if (status === 'uploading' || status === 'processing') {
    const label = phaseLabel(phase) ?? (status === 'uploading' ? 'Uploading…' : 'Transcribing…')
    return (
      <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-amber-700">
        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} />
        {label}
        {progress != null ? (
          <span className="lv-mono tabular-nums text-amber-700/70">{progress}%</span>
        ) : null}
      </p>
    )
  }
  if (status === 'ready') {
    return (
      <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
        Ready · Open
        <span aria-hidden className="ml-0.5 transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </p>
    )
  }
  if (status === 'failed') {
    return (
      <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-red-700">
        <AlertTriangle className="h-3 w-3" strokeWidth={2.4} />
        Failed · Retry
      </p>
    )
  }
  return null
}

const TONE_FOR_STATUS: Record<
  ContentStatus,
  { iconBg: string; iconColor: string }
> = {
  uploading: {
    iconBg: 'bg-amber-50 border border-amber-200/70',
    iconColor: 'text-amber-600',
  },
  processing: {
    iconBg: 'bg-amber-50 border border-amber-200/70',
    iconColor: 'text-amber-600',
  },
  ready: {
    iconBg: 'bg-emerald-50 border border-emerald-200/60',
    iconColor: 'text-emerald-600',
  },
  failed: {
    iconBg: 'bg-red-50 border border-red-200/60',
    iconColor: 'text-red-600',
  },
}

// Re-export the type so callers can import it from one place if needed.
export type { RecentImportsBucket }
