'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Check, ChevronLeft, ChevronRight, Clapperboard, ExternalLink, Loader2 } from 'lucide-react'

import { ScheduleOutputDialog } from '@/components/pipeline/schedule-output-dialog'

import {
  transitionOutputStateAction,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { OutputState } from '@/lib/supabase/types'

interface PipelineCardProps {
  outputId: string
  workspaceId: string
  contentId: string
  platform: string
  platformLabel: string
  platformBadgeClass: string
  contentTitle: string | null
  bodyPreview: string | null
  currentState: OutputState
  createdAt: string
  formattedDate: string
  /** Slice 16 — highest version number from output_versions. Cards
   *  render a small "v2" mono-badge when > 1 to surface re-gen history. */
  version?: number
  /** When provided, the card shows a selection checkbox. */
  selected?: boolean
  onToggleSelect?: () => void
  /** Optional optimistic-update hook from the parent board. Called
   *  with the new state right before the server action fires so the
   *  card moves columns immediately instead of after the round-trip.
   *  When omitted, the card still works (just without optimism). */
  onOptimisticTransition?: (outputId: string, newState: OutputState) => void
}

const STATE_ORDER: OutputState[] = ['draft', 'review', 'approved', 'exported']

// Labels for the step-forward button on each column. On the "approved"
// column we deliberately hide the forward button — the real next step is
// Schedule or Publish (shown inline), not a state-flip to `exported`.
// Keeping `approved → exported` as an auto-CTA used to read as "Mark as
// published" which implied an actual publish to socials; the flag is
// just bookkeeping, so users would click it and wonder why nothing
// happened on TikTok.
const NEXT_STATE_LABELS: Record<OutputState, string | null> = {
  draft: 'Move to review',
  review: 'Approve',
  approved: null,
  exported: null,
}

const PREV_STATE_LABELS: Record<OutputState, string | null> = {
  draft: null,
  review: 'Back to draft',
  approved: 'Back to review',
  exported: 'Back to approved',
}

function nextState(state: OutputState): OutputState | null {
  const idx = STATE_ORDER.indexOf(state)
  return idx >= 0 && idx < STATE_ORDER.length - 1 ? STATE_ORDER[idx + 1] ?? null : null
}

function prevState(state: OutputState): OutputState | null {
  const idx = STATE_ORDER.indexOf(state)
  return idx > 0 ? STATE_ORDER[idx - 1] ?? null : null
}

/**
 * Imperative state-transition button. Compared to the prior form-action
 * version, this:
 *   1. Calls the parent's `onOptimisticTransition` BEFORE the server
 *      action so the card moves columns the moment the user clicks,
 *      not 300-1500ms later when the network resolves.
 *   2. Wraps the action call in `startTransition` so React can apply
 *      the optimistic state without blocking the UI.
 *   3. Falls back to a no-op when `onOptimisticTransition` isn't
 *      provided — the card still works, just without optimism.
 */
function TransitionButton({
  direction,
  label,
  outputId,
  workspaceId,
  targetState,
  onOptimisticTransition,
}: {
  direction: 'next' | 'prev'
  label: string
  outputId: string
  workspaceId: string
  targetState: OutputState
  onOptimisticTransition?: (outputId: string, newState: OutputState) => void
}) {
  const [pending, startTransition] = useTransition()
  const isNext = direction === 'next'

  function handleClick() {
    startTransition(async () => {
      onOptimisticTransition?.(outputId, targetState)
      const fd = new FormData()
      fd.set('output_id', outputId)
      fd.set('workspace_id', workspaceId)
      fd.set('new_state', targetState)
      // The action's return value (state) doesn't matter here — the
      // parent will re-fetch via router.refresh() on its next tick.
      // Errors surface as Sentry breadcrumbs + the row reverts when
      // the optimistic state expires (no router.refresh = stale).
      await transitionOutputStateAction({}, fd)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={
        isNext
          ? 'flex w-full items-center justify-center gap-1 rounded-lg bg-[#0F0F0F]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#0F0F0F] transition-all hover:bg-[#0F0F0F] hover:text-[#F4D93D] hover:shadow-sm disabled:opacity-50'
          : 'flex items-center justify-center rounded-lg border border-border/60 px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground disabled:opacity-50'
      }
      aria-label={label}
      title={label}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isNext ? (
        <>
          {label}
          <ChevronRight className="h-3 w-3" />
        </>
      ) : (
        <ChevronLeft className="h-3 w-3" />
      )}
    </button>
  )
}

export function PipelineCard({
  outputId,
  workspaceId,
  contentId,
  platform,
  platformLabel,
  platformBadgeClass,
  contentTitle,
  bodyPreview,
  currentState,
  formattedDate,
  version,
  selected = false,
  onToggleSelect,
  onOptimisticTransition,
}: PipelineCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = nextState(currentState)
  const prev = prevState(currentState)
  const nextLabel = NEXT_STATE_LABELS[currentState]
  const prevLabel = PREV_STATE_LABELS[currentState]
  const selectable = typeof onToggleSelect === 'function'

  function openReview() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('review', outputId)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div
      className={`group relative flex flex-col gap-2.5 rounded-xl border p-3 transition-all duration-200 ${
        selected
          ? 'border-primary/40 bg-primary/[0.04] shadow-sm shadow-primary/[0.08]'
          : 'border-border/50 bg-card shadow-sm hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md hover:shadow-primary/[0.06]'
      }`}
    >
      {/* Top row: checkbox + title link */}
      <div className="flex items-start gap-2">
        {selectable && (
          <button
            type="button"
            onClick={onToggleSelect}
            aria-label={selected ? 'Deselect' : 'Select'}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
              selected
                ? 'border-[#0F0F0F] bg-[#0F0F0F] text-[#F4D93D]'
                : 'border-border/70 bg-background opacity-60 hover:border-primary/40 hover:opacity-100 group-hover:opacity-100'
            }`}
          >
            {selected && <Check className="h-3 w-3" strokeWidth={3} />}
          </button>
        )}

        <button
          type="button"
          onClick={openReview}
          className="group/link min-w-0 flex-1 space-y-1 text-left"
          aria-label={`Review draft: ${contentTitle ?? 'Untitled'}`}
        >
          <p className="truncate text-sm font-semibold leading-tight text-foreground group-hover/link:text-primary">
            {contentTitle ?? 'Untitled'}
          </p>
          {bodyPreview && (
            <p className="line-clamp-2 text-[11px] text-muted-foreground">
              {bodyPreview}
            </p>
          )}
        </button>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${platformBadgeClass}`}
          >
            {platformLabel}
          </span>
          {version && version > 1 ? (
            <span
              className="inline-flex items-center rounded-full border border-primary/30 bg-primary/[0.08] px-1.5 py-0.5 font-mono text-[9.5px] font-bold tabular-nums tracking-tight text-primary"
              title={`Version ${version} — this draft has been regenerated or edited`}
            >
              v{version}
            </span>
          ) : null}
        </div>
        <span className="text-[10px] text-muted-foreground/60">{formattedDate}</span>
      </div>

      {/* Transition controls */}
      <div className="flex items-stretch gap-1.5 pt-1">
        {prev && prevLabel && (
          <TransitionButton
            direction="prev"
            label={prevLabel}
            outputId={outputId}
            workspaceId={workspaceId}
            targetState={prev}
            onOptimisticTransition={onOptimisticTransition}
          />
        )}
        {next && nextLabel ? (
          <TransitionButton
            direction="next"
            label={nextLabel}
            outputId={outputId}
            workspaceId={workspaceId}
            targetState={next}
            onOptimisticTransition={onOptimisticTransition}
          />
        ) : (
          <Link
            href={`/workspace/${workspaceId}/content/${contentId}/outputs`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
          >
            Open
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Publish actions — the real "next step" once a draft is approved.
          Schedule (primary) + Render MP4 (secondary). Users who land here
          expecting to "publish" get an obvious path instead of having to
          navigate away to the Schedule page. */}
      {(currentState === 'approved' || currentState === 'exported') && (
        <div className="flex flex-wrap items-stretch gap-1.5 border-t border-border/30 pt-2">
          <ScheduleOutputDialog
            outputId={outputId}
            workspaceId={workspaceId}
            platform={platform}
            platformLabel={platformLabel}
            contentTitle={contentTitle}
          />
          <Link
            href={`/workspace/${workspaceId}/content/${contentId}/outputs#video-studio`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0F0F0F]/10 px-2 py-1.5 text-[10px] font-semibold text-[#0F0F0F] transition-all hover:bg-[#0F0F0F] hover:text-[#F4D93D]"
          >
            <Clapperboard className="h-3 w-3" />
            Render MP4
          </Link>
        </div>
      )}
    </div>
  )
}
