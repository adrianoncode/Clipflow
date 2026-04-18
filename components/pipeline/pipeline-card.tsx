'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { Check, ChevronLeft, ChevronRight, Clapperboard, ExternalLink, Loader2 } from 'lucide-react'

import { ScheduleOutputDialog } from '@/components/pipeline/schedule-output-dialog'

import {
  transitionOutputStateAction,
  type TransitionOutputStateState,
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
  /** When provided, the card shows a selection checkbox. */
  selected?: boolean
  onToggleSelect?: () => void
}

const STATE_ORDER: OutputState[] = ['draft', 'review', 'approved', 'exported']

const NEXT_STATE_LABELS: Record<OutputState, string | null> = {
  draft: 'Move to review',
  review: 'Approve',
  approved: 'Mark as published',
  exported: null,
}

const PREV_STATE_LABELS: Record<OutputState, string | null> = {
  draft: null,
  review: 'Back to draft',
  approved: 'Back to review',
  exported: 'Undo',
}

function nextState(state: OutputState): OutputState | null {
  const idx = STATE_ORDER.indexOf(state)
  return idx >= 0 && idx < STATE_ORDER.length - 1 ? STATE_ORDER[idx + 1] ?? null : null
}

function prevState(state: OutputState): OutputState | null {
  const idx = STATE_ORDER.indexOf(state)
  return idx > 0 ? STATE_ORDER[idx - 1] ?? null : null
}

const initialState: TransitionOutputStateState = {}

function TransitionButton({
  direction,
  label,
  outputId,
  workspaceId,
  targetState,
}: {
  direction: 'next' | 'prev'
  label: string
  outputId: string
  workspaceId: string
  targetState: OutputState
}) {
  const [, formAction] = useFormState(transitionOutputStateAction, initialState)

  return (
    <form action={formAction} className={direction === 'next' ? 'flex-1' : ''}>
      <input type="hidden" name="output_id" value={outputId} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="new_state" value={targetState} />
      <SubmitButton direction={direction} label={label} />
    </form>
  )
}

function SubmitButton({
  direction,
  label,
}: {
  direction: 'next' | 'prev'
  label: string
}) {
  const { pending } = useFormStatus()
  const isNext = direction === 'next'

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        isNext
          ? 'flex w-full items-center justify-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-sm disabled:opacity-50'
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
  selected = false,
  onToggleSelect,
}: PipelineCardProps) {
  const next = nextState(currentState)
  const prev = prevState(currentState)
  const nextLabel = NEXT_STATE_LABELS[currentState]
  const prevLabel = PREV_STATE_LABELS[currentState]
  const selectable = typeof onToggleSelect === 'function'

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
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/70 bg-background opacity-60 hover:border-primary/40 hover:opacity-100 group-hover:opacity-100'
            }`}
          >
            {selected && <Check className="h-3 w-3" strokeWidth={3} />}
          </button>
        )}

        <Link
          href={`/workspace/${workspaceId}/content/${contentId}/outputs`}
          className="group/link min-w-0 flex-1 space-y-1"
        >
          <p className="truncate text-sm font-semibold leading-tight text-foreground group-hover/link:text-primary">
            {contentTitle ?? 'Untitled'}
          </p>
          {bodyPreview && (
            <p className="line-clamp-2 text-[11px] text-muted-foreground">
              {bodyPreview}
            </p>
          )}
        </Link>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${platformBadgeClass}`}
        >
          {platformLabel}
        </span>
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
          />
        )}
        {next && nextLabel ? (
          <TransitionButton
            direction="next"
            label={nextLabel}
            outputId={outputId}
            workspaceId={workspaceId}
            targetState={next}
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

      {/* Quick actions for approved/exported outputs */}
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
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-pink-50 px-2 py-1.5 text-[10px] font-semibold text-pink-700 transition-all hover:bg-pink-100"
          >
            <Clapperboard className="h-3 w-3" />
            Render MP4
          </Link>
        </div>
      )}
    </div>
  )
}
