import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, CalendarClock, CheckCircle2, GitBranch, Plus } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { CreateStepper } from '@/components/create/create-stepper'
import { PipelineEmptyPreview } from '@/components/pipeline/pipeline-empty-preview'
import { PipelineFilterBar } from '@/components/pipeline/pipeline-filter-bar'
import {
  PipelineBoard,
  type PipelineStateKey,
  type PipelineOutputItem,
  type PipelineColumn,
} from '@/components/pipeline/pipeline-board'
import { getUser } from '@/lib/auth/get-user'
import { getLatestContentId } from '@/lib/content/get-content-items'
import { getOutputLatestVersions } from '@/lib/outputs/get-output-versions'
import { createClient } from '@/lib/supabase/server'
import { PLATFORM_LABELS, PLATFORM_SOFT_COLORS as PLATFORM_BADGE_COLORS } from '@/lib/platforms'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Drafts' }

// Pipeline = Step 5 (Approve). "Published" lives on Schedule (Step 6),
// not here — published outputs are filtered out of enriched below.
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
  searchParams: { platform?: string }
}

export default async function PipelinePage({ params, searchParams }: PipelinePageProps) {
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
  const [membershipResult, outputsResult, latestContentId] = await Promise.all([
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
    getLatestContentId(workspaceId),
  ])

  if (!membershipResult.data) notFound()

  const { data: outputs } = outputsResult

  // Slice 16: enrich each output with its highest version number so
  // the card can render a "v2" badge when the draft has history.
  const allVisible = (outputs ?? []).filter(
    (o) => (o.current_state ?? 'draft') !== 'exported',
  )

  // Slice 14 — platform filter via ?platform=tiktok,linkedin. We compute
  // counts BEFORE filtering so the filter-bar shows totals across all
  // visible (non-published) outputs, not "filtered ∩ filtered".
  const platformCounts: Record<string, number> = {}
  for (const o of allVisible) {
    platformCounts[o.platform] = (platformCounts[o.platform] ?? 0) + 1
  }
  const platformFilter = (searchParams.platform ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const visibleOutputs =
    platformFilter.length > 0
      ? allVisible.filter((o) => platformFilter.includes(o.platform))
      : allVisible

  const versionMap = await getOutputLatestVersions(
    workspaceId,
    visibleOutputs.map((o) => o.id),
  )

  // Filter out 'exported' (published) outputs — those belong to Schedule
  // (Step 6), not Pipeline (Step 5). Anything else falls back to 'draft'
  // so unknown DB states don't crash the board.
  const enriched: PipelineOutputItem[] = visibleOutputs
    .map((o) => {
      const contentItem = o.content_items as unknown as { title: string | null } | null
      const rawState = o.current_state ?? 'draft'
      const state: PipelineStateKey =
        rawState === 'review' || rawState === 'approved'
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
        body: (o.body as string | null) ?? null,
        state,
        version: versionMap.get(o.id) ?? 1,
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
  const reviewCount = grouped.review.length

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-8">
      <CreateStepper
        workspaceId={workspaceId}
        activeStep={5}
        contentId={latestContentId ?? undefined}
      />
      <PageHeader
        category={`${totalCount === 0 ? 'Drafts pipeline' : `${totalCount} draft${totalCount === 1 ? '' : 's'}`}`}
        title="Drafts."
        description={
          totalCount === 0
            ? undefined
            : `${reviewCount} waiting · ${approvedCount} approved`
        }
        actions={
          <>
            {approvedCount > 0 && (
              <Link
                href={`/workspace/${workspaceId}/schedule?view=calendar`}
                className="group inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-transform hover:scale-[1.02]"
                style={{
                  background: '#F4D93D',
                  color: '#0F0F0F',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 12px -4px rgba(220,185,31,0.45)',
                }}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Schedule {approvedCount}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
            <Link
              href={`/workspace/${workspaceId}/content/new`}
              className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-[13px] font-semibold transition-transform hover:scale-[1.02]"
              style={{
                background: '#0F0F0F',
                color: '#FFFFFF',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 12px -4px rgba(15,15,15,0.45)',
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Import
            </Link>
          </>
        }
      />

      {/* Workflow-Flow-Strip removed — global CreateStepper above already
          shows where you are in the 6-step section, and the kanban columns
          themselves report state counts. The mini-stepper duplicated both. */}

      {/* Slice 14 — platform filter. Hidden when there's no data yet so
          the empty-state below isn't crowded by a meaningless filter row. */}
      {totalCount > 0 || platformFilter.length > 0 ? (
        <PipelineFilterBar platformCounts={platformCounts} />
      ) : null}

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

      {/* Bottom-Sticky CTA — sits at the bottom of the page-scroll
          area whenever there are approved drafts ready to ship. The
          header has the same affordance for users who land at the top;
          this one stays in reach during long-scroll review sessions. */}
      {approvedCount > 0 ? (
        <div className="sticky bottom-4 z-30 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/95 px-4 py-3 shadow-[0_12px_32px_-16px_rgba(16,185,129,0.45)] backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
            >
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <p className="min-w-0 truncate text-[13px] font-bold text-emerald-900">
              {approvedCount} approved · ready to schedule
            </p>
          </div>
          <Link
            href={`/workspace/${workspaceId}/schedule?view=calendar`}
            className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#2A1A3D] px-3.5 text-[12.5px] font-bold text-[#D6FF3E] transition-all hover:-translate-y-px hover:bg-[#1A0F2A]"
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            Schedule them
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      ) : null}
    </div>
  )
}
