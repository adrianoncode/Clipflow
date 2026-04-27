import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, CalendarClock, Plus, GitBranch } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { DraftsTabNav } from '@/components/pipeline/drafts-tab-nav'
import { PipelineEmptyPreview } from '@/components/pipeline/pipeline-empty-preview'
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

  // Parallelize the membership verify + outputs fetch. Previously the
  // membership check ran first, adding one sequential round-trip before
  // outputs could load. We already know the user id, so we can kick both
  // off together and validate membership when results return. If the
  // user isn't a member, RLS hides the outputs rows anyway — membership
  // check is defence in depth plus the 404 affordance.
  const [membershipResult, outputsResult] = await Promise.all([
    supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('outputs')
      .select(
        'id, platform, created_at, content_id, body, current_state, content_items(title)',
      )
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  if (!membershipResult.data) notFound()

  const { data: outputs } = outputsResult

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
      <PageHeader
        category={`${totalCount === 0 ? 'Drafts pipeline' : `${totalCount} draft${totalCount === 1 ? '' : 's'}`}`}
        title="Drafts."
        description={
          totalCount === 0
            ? undefined
            : `${reviewCount} waiting · ${approvedCount} approved · ${exportedCount} published`
        }
        actions={
          <>
            {approvedCount > 0 && (
              <Link
                href={`/workspace/${workspaceId}/schedule?view=calendar`}
                className="group inline-flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-3.5 py-2 text-[13px] font-semibold text-emerald-700 transition-all hover:-translate-y-px hover:bg-emerald-100 hover:shadow-md"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Schedule {approvedCount}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
            <Link
              href={`/workspace/${workspaceId}/content/new`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25"
            >
              <Plus className="h-3.5 w-3.5" />
              Import
            </Link>
          </>
        }
      />

      {/* Tab strip — Board / Calendar / Queue. Schedule is no longer a
          separate destination, it's a sibling view of Drafts. */}
      <DraftsTabNav
        workspaceId={workspaceId}
        current="board"
        approvedCount={approvedCount}
      />

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
          title="A kanban for your unpublished work."
          description="Drafts land in the leftmost column. Move them right as you review, approve, and ship — same shape as the preview here. Nothing publishes until you say so."
          actionLabel="Import a video"
          actionHref={`/workspace/${workspaceId}/content/new`}
          secondaryLabel="Back to library"
          secondaryHref={`/workspace/${workspaceId}`}
          steps={[
            {
              title: 'Generate drafts from a source',
              body: 'Import a video, then trigger generation. Hooks + captions land in Draft.',
            },
            {
              title: 'Review and approve what works',
              body: 'Drag from Review → Approved. Bulk-approve with shift-click. Reject with a reason if you want a regen.',
            },
            {
              title: 'Schedule the approved ones',
              body: 'One click sends approved drafts to the calendar. Auto-publish handles the rest.',
            },
          ]}
          preview={<PipelineEmptyPreview />}
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
