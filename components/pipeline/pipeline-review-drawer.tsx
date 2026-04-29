'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  X,
} from 'lucide-react'
import { useFormState, useFormStatus } from 'react-dom'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { RejectOutputModal } from '@/components/pipeline/reject-output-modal'
import {
  transitionOutputStateAction,
  type TransitionOutputStateState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import { regenerateOutputAction, type RegenerateOutputState } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { PipelineOutputItem } from '@/components/pipeline/pipeline-board'

/**
 * Side-Panel review drawer for the Pipeline (Step 5).
 *
 * URL-driven so deep links + browser back-button work: `?review=<output_id>`
 * opens the drawer with that output. Closing clears the param. Prev/Next
 * arrows mutate the param to swipe through cards in the visible order.
 *
 * The drawer is the canonical reviewer surface — full output body,
 * Approve/Back state transitions, Regenerate. Heavier editing still lives
 * on the per-video Drafts tab (linked at the bottom).
 */
interface PipelineReviewDrawerProps {
  workspaceId: string
  /** All outputs visible on the board, in their display order. The drawer
   *  uses this list to find the current output by id and compute the
   *  prev/next ids for swipe navigation. */
  outputs: PipelineOutputItem[]
}

export function PipelineReviewDrawer({
  workspaceId,
  outputs,
}: PipelineReviewDrawerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reviewId = searchParams.get('review')

  // Order: Review first, then Draft, then Approved — matches the column
  // order, gives the reviewer the highest-priority items first when
  // swiping with prev/next. Inside each bucket we keep insertion order.
  const ordered = useMemo(() => {
    const buckets: Record<string, PipelineOutputItem[]> = {
      review: [],
      draft: [],
      approved: [],
    }
    for (const o of outputs) {
      if (buckets[o.state]) buckets[o.state]!.push(o)
    }
    return [...buckets.review!, ...buckets.draft!, ...buckets.approved!]
  }, [outputs])

  const idx = ordered.findIndex((o) => o.id === reviewId)
  const current = idx >= 0 ? ordered[idx] : null
  const prev = idx > 0 ? ordered[idx - 1]! : null
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1]! : null

  const isOpen = current !== null

  function close() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('review')
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '?', { scroll: false })
  }

  function navigateTo(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('review', id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // Cmd-N / Cmd-P for prev/next while drawer is open. J/K shortcut polish
  // can come in a follow-up — these two are enough to swipe at speed.
  useEffect(() => {
    if (!isOpen) return
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
      }
      if (e.key === 'j' && next) {
        e.preventDefault()
        navigateTo(next.id)
      } else if (e.key === 'k' && prev) {
        e.preventDefault()
        navigateTo(prev.id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prev?.id, next?.id])

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
        {/* a11y title kept off-screen via sr-only — the visual title
            in the drawer header is the platform badge + state pill,
            which describes the draft better than a generic "Review". */}
        <DialogTitle className="sr-only">Review draft</DialogTitle>
        {current ? (
          <DrawerBody
            output={current}
            workspaceId={workspaceId}
            position={{ idx: idx + 1, total: ordered.length }}
            onPrev={prev ? () => navigateTo(prev.id) : null}
            onNext={next ? () => navigateTo(next.id) : null}
            onClose={close}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function DrawerBody({
  output,
  workspaceId,
  position,
  onPrev,
  onNext,
  onClose,
}: {
  output: PipelineOutputItem
  workspaceId: string
  position: { idx: number; total: number }
  onPrev: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)

  return (
    <div className="flex h-full max-h-[90vh] flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] ${output.platformBadgeClass}`}
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            {output.platformLabel}
          </span>
          <StatePill state={output.state} />
          <span
            className="lv-mono text-[10.5px] tabular-nums text-muted-foreground/70"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            {position.idx} / {position.total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!onPrev}
            onClick={() => onPrev?.()}
            aria-label="Previous draft (K)"
            title="Previous draft (K)"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!onNext}
            onClick={() => onNext?.()}
            aria-label="Next draft (J)"
            title="Next draft (J)"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close (Esc)"
            title="Close (Esc)"
            className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Source
        </p>
        <p className="mb-4 text-[14px] font-bold tracking-tight text-foreground">
          {output.contentTitle ?? 'Untitled'}
        </p>
        <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Draft body
        </p>
        <div
          className="rounded-xl border border-border/50 bg-muted/20 p-4 text-[13px] leading-relaxed text-foreground"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {output.body?.trim() ?? '(empty)'}
        </div>
      </div>

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-5 py-3">
        <a
          href={`/workspace/${workspaceId}/content/${output.contentId}/outputs`}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Open full editor
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <RegenerateInline
            workspaceId={workspaceId}
            contentId={output.contentId}
            outputId={output.id}
            platform={output.platform}
          />
          {output.state === 'review' ? (
            // Reject opens the reason-modal — a one-step rejection that
            // jumps straight to draft (skipping the implicit review→draft
            // transition the old generic Send-back did) and saves the
            // reviewer's reason on the output for the next pass.
            <button
              type="button"
              onClick={() => setRejectOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 text-[12.5px] font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reject
            </button>
          ) : output.state === 'approved' ? (
            // Approved → review is a no-comment step-back (typo fix,
            // realized it shouldn't have been approved). Comments go
            // through the Reject path on review-state cards.
            <TransitionInline
              workspaceId={workspaceId}
              outputId={output.id}
              targetState={prevStateOf(output.state)}
              variant="ghost"
              label={prevLabelOf(output.state)}
            />
          ) : null}
          {output.state !== 'approved' ? (
            <TransitionInline
              workspaceId={workspaceId}
              outputId={output.id}
              targetState={nextStateOf(output.state)}
              variant="primary"
              label={nextLabelOf(output.state)}
            />
          ) : null}
        </div>
      </footer>

      <RejectOutputModal
        workspaceId={workspaceId}
        outputId={output.id}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />
    </div>
  )
}

function StatePill({ state }: { state: PipelineOutputItem['state'] }) {
  const tone =
    state === 'approved'
      ? 'bg-emerald-100 text-emerald-700'
      : state === 'review'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-zinc-200 text-zinc-700'
  const label =
    state === 'approved' ? 'Approved' : state === 'review' ? 'Review' : 'Draft'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] ${tone}`}
      style={{
        fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
      }}
    >
      {label}
    </span>
  )
}

function prevStateOf(state: PipelineOutputItem['state']): PipelineOutputItem['state'] {
  if (state === 'review') return 'draft'
  if (state === 'approved') return 'review'
  return 'draft'
}

function nextStateOf(state: PipelineOutputItem['state']): PipelineOutputItem['state'] {
  if (state === 'draft') return 'review'
  if (state === 'review') return 'approved'
  return 'approved'
}

function prevLabelOf(state: PipelineOutputItem['state']): string {
  if (state === 'review') return 'Send back to draft'
  if (state === 'approved') return 'Send back to review'
  return 'Back'
}

function nextLabelOf(state: PipelineOutputItem['state']): string {
  if (state === 'draft') return 'Move to review'
  if (state === 'review') return 'Approve'
  return 'Approve'
}

function TransitionInline({
  workspaceId,
  outputId,
  targetState,
  label,
  variant,
}: {
  workspaceId: string
  outputId: string
  targetState: PipelineOutputItem['state']
  label: string
  variant: 'primary' | 'ghost'
}) {
  const [, action] = useFormState(
    transitionOutputStateAction,
    {} as TransitionOutputStateState,
  )
  return (
    <form action={action}>
      <input type="hidden" name="output_id" value={outputId} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="new_state" value={targetState} />
      <TransitionSubmit label={label} variant={variant} />
    </form>
  )
}

function TransitionSubmit({
  label,
  variant,
}: {
  label: string
  variant: 'primary' | 'ghost'
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === 'primary'
          ? 'inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2A1A3D] px-3.5 text-[12.5px] font-bold tracking-tight text-[#D6FF3E] transition-all hover:bg-[#1A0F2A] disabled:cursor-not-allowed disabled:opacity-60'
          : 'inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 text-[12.5px] font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60'
      }
      style={{
        fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
      }}
    >
      {label}
      {variant === 'primary' ? <ArrowRight className="h-3.5 w-3.5" /> : null}
    </button>
  )
}

function RegenerateInline({
  workspaceId,
  contentId,
  outputId,
  platform,
}: {
  workspaceId: string
  contentId: string
  outputId: string
  platform: string
}) {
  const [, action] = useFormState(
    regenerateOutputAction,
    {} as RegenerateOutputState,
  )
  return (
    <form action={action}>
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="content_id" value={contentId} />
      <input type="hidden" name="output_id" value={outputId} />
      <input type="hidden" name="platform" value={platform} />
      <RegenerateSubmit />
    </form>
  )
}

function RegenerateSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 text-[12.5px] font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
      }}
    >
      <RotateCcw className={`h-3 w-3 ${pending ? 'animate-spin' : ''}`} />
      {pending ? 'Regenerating' : 'Regenerate'}
    </button>
  )
}
