import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, CalendarClock, Plus, GitBranch } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import {
  PipelineBoard,
  type PipelineStateKey,
  type PipelineOutputItem,
  type PipelineColumn,
} from '@/components/pipeline/pipeline-board'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { PLATFORM_LABELS, PLATFORM_SOFT_COLORS as PLATFORM_BADGE_COLORS } from '@/lib/platforms'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Drafts' }

const COLUMN_CONFIG: PipelineColumn[] = [
  {
    state: 'draft',
    label: 'Draft',
    accentClass: 'from-zinc-500/60',
    dotClass: 'bg-zinc-400',
  },
  {
    state: 'review',
    label: 'Ready to review',
    accentClass: 'from-amber-400',
    dotClass: 'bg-amber-400',
  },
  {
    state: 'approved',
    label: 'Approved',
    accentClass: 'from-emerald-500',
    dotClass: 'bg-emerald-500',
  },
  {
    state: 'exported',
    label: 'Published',
    accentClass: 'from-blue-500',
    dotClass: 'bg-blue-500',
  },
]

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.round(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function bodySnippet(body: string | null | undefined): string | null {
  if (!body) return null
  const clean = body.replace(/\s+/g, ' ').trim()
  if (clean.length === 0) return null
  return clean.length > 120 ? clean.slice(0, 120).trimEnd() + '…' : clean
}

interface PipelinePageProps {
  params: { id: string }
}

export default async function PipelinePage({ params }: PipelinePageProps) {
  const { id: workspaceId } = params

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()

  // Verify workspace membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) notFound()

  // Single query using the denormalized `current_state` column populated
  // by the trigger on output_states insert. Replaces the previous 2-query
  // pattern that fetched every state transition and scanned in JS.
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, platform, created_at, content_id, body, current_state, content_items(title)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(200)

  const enriched: PipelineOutputItem[] = (outputs ?? []).map((o) => {
    const contentItem = o.content_items as unknown as { title: string | null } | null
    const rawState = o.current_state ?? 'draft'
    const state: PipelineStateKey =
      rawState === 'review' || rawState === 'approved' || rawState === 'exported'
        ? (rawState as PipelineStateKey)
        : 'draft'
    return {
      id: o.id,
      platform: o.platform,
      platformLabel: PLATFORM_LABELS[o.platform] ?? o.platform,
      platformBadgeClass:
        PLATFORM_BADGE_COLORS[o.platform] ?? 'bg-muted text-muted-foreground',
      contentId: o.content_id,
      contentTitle: contentItem?.title ?? null,
      bodyPreview: bodySnippet(o.body),
      state,
      createdAt: o.created_at,
      formattedDate: formatRelative(o.created_at),
    }
  })

  const grouped: Record<PipelineStateKey, PipelineOutputItem[]> = {
    draft: [],
    review: [],
    approved: [],
    exported: [],
  }
  for (const output of enriched) {
    grouped[output.state].push(output)
  }

  const totalCount = enriched.length

  const approvedCount = grouped.approved.length
  const exportedCount = grouped.exported.length
  const reviewCount = grouped.review.length

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            <Link href={`/workspace/${workspaceId}`} className="hover:text-foreground transition-colors">Content</Link>
            {' → '}
            <span className="font-medium text-foreground">Drafts</span>
            {' → '}
            <Link href={`/workspace/${workspaceId}/schedule`} className="hover:text-foreground transition-colors">Schedule</Link>
          </p>
          <h1 className="text-xl font-bold tracking-tight">Drafts</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? 'Your drafts land here. Pick the ones you like and approve them.'
              : `${totalCount} draft${totalCount === 1 ? '' : 's'} · ${reviewCount} waiting · ${approvedCount} approved`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {approvedCount > 0 && (
            <Link
              href={`/workspace/${workspaceId}/schedule`}
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all hover:-translate-y-px hover:bg-emerald-100 hover:shadow-md"
            >
              <CalendarClock className="h-4 w-4" />
              Schedule {approvedCount}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <Link
            href={`/workspace/${workspaceId}/content/new`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            Import
          </Link>
        </div>
      </div>

      {/* ── Workflow flow strip ── */}
      {totalCount > 0 && (
        <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-card p-2">
          {([
            { state: 'draft' as const, label: 'Draft', count: grouped.draft.length, dot: 'bg-zinc-400' },
            { state: 'review' as const, label: 'Review', count: reviewCount, dot: 'bg-amber-400' },
            { state: 'approved' as const, label: 'Approved', count: approvedCount, dot: 'bg-emerald-400' },
            { state: 'exported' as const, label: 'Published', count: exportedCount, dot: 'bg-blue-500' },
          ] as const).map((step, i) => (
            <div key={step.state} className="flex flex-1 items-center gap-1.5">
              {i > 0 && <div className="h-px w-3 bg-border/60 sm:w-6" />}
              <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${step.dot}`} />
                <span className="hidden text-[11px] font-semibold sm:inline">{step.label}</span>
                <span className="font-mono text-[11px] font-bold tabular-nums text-muted-foreground">
                  {step.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {totalCount === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No drafts yet"
          description="Import a video and generate drafts. They land here for review and approval."
          actionLabel="Go to videos"
          actionHref={`/workspace/${workspaceId}`}
          secondaryLabel="Import a video"
          secondaryHref={`/workspace/${workspaceId}/content/new`}
        />
      ) : (
        <PipelineBoard
          workspaceId={workspaceId}
          columns={COLUMN_CONFIG}
          grouped={grouped}
        />
      )}
    </div>
  )
}
