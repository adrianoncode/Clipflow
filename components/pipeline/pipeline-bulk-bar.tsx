'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  Loader2,
  RefreshCw,
  Send,
  Star,
  X,
} from 'lucide-react'

import {
  bulkApproveAction,
  bulkExportAction,
  bulkRegenerateAction,
  bulkStarAction,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/bulk-actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface PipelineBulkBarProps {
  workspaceId: string
  selected: Set<string>
  onClear: () => void
  /** Optional optimistic-update hook from the board. Called for each
   *  selected id with the target state right before the bulk action
   *  fires — cards move to their new column instantly instead of after
   *  the round-trip + router.refresh. Approve → 'approved', Export →
   *  'exported'. Regenerate + Star don't move cards so we skip them. */
  onOptimisticBulk?: (
    ids: Set<string>,
    newState: 'approved' | 'exported' | null,
  ) => void
}

type Banner =
  | { kind: 'success'; text: string }
  | { kind: 'error'; text: string }
  | null

type BulkAction = typeof bulkApproveAction

export function PipelineBulkBar({ workspaceId, selected, onClear, onOptimisticBulk }: PipelineBulkBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  // Ref lets us cancel the banner timeout on unmount or before
  // scheduling a new one — prevents "setState on unmounted component"
  // and prevents stale banners from lingering under a fresh one.
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    },
    [],
  )

  const count = selected.size
  if (count === 0) return null

  function runAction(
    label: string,
    action: BulkAction,
    successVerb: string,
    /** Target column for optimistic moves. Pass null for bulk
     *  actions that don't move cards (Regenerate, Star). */
    optimisticTarget: 'approved' | 'exported' | null = null,
  ) {
    setActiveAction(label)
    startTransition(async () => {
      // Apply optimistic moves BEFORE the action so the cards leave
      // their current columns instantly. The optimistic state is
      // discarded by useOptimistic's contract once the transition
      // completes — at that point router.refresh below has loaded
      // the authoritative grouping.
      if (optimisticTarget) {
        onOptimisticBulk?.(selected, optimisticTarget)
      }
      const fd = new FormData()
      fd.set('workspace_id', workspaceId)
      fd.set('output_ids', Array.from(selected).join(','))

      const result = await action({}, fd)
      setActiveAction(null)

      if (result.ok === true) {
        const hasPartialFailure = result.failed && result.failed > 0
        setBanner({
          kind: hasPartialFailure ? 'error' : 'success',
          text: hasPartialFailure
            ? `${successVerb} ${result.count}, but ${result.failed} failed${result.firstError ? `: ${result.firstError}` : ''}`
            : `${successVerb} ${result.count} ${result.count === 1 ? 'draft' : 'drafts'}`,
        })
        onClear()
        router.refresh()
      } else if (result.ok === false) {
        setBanner({ kind: 'error', text: result.error })
      }
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      clearTimerRef.current = setTimeout(() => setBanner(null), 3000)
    })
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6">
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/70 bg-background/95 p-1.5 shadow-xl shadow-black/[0.12] backdrop-blur-md"
        role="toolbar"
        aria-label="Pipeline bulk actions"
      >
        {/* Count + clear */}
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
        >
          <X className="h-3 w-3" />
          {count} selected
        </button>

        <span aria-hidden className="mx-0.5 h-5 w-px bg-border/60" />

        {/* Star */}
        <button
          type="button"
          onClick={() => runAction('star', bulkStarAction, 'Starred')}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-50 disabled:opacity-50"
        >
          {activeAction === 'star' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star className="h-3.5 w-3.5" />
          )}
          Star
        </button>

        {/* Approve */}
        <button
          type="button"
          onClick={() => runAction('approve', bulkApproveAction, 'Approved', 'approved')}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-50 disabled:opacity-50"
        >
          {activeAction === 'approve' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCheck className="h-3.5 w-3.5" />
          )}
          Approve
        </button>

        {/* Regenerate — reruns the AI pipeline on each selected draft.
            Agencies use this after updating brand voice to refresh
            existing drafts without clicking through each one. */}
        <ConfirmDialog
          tone="destructive"
          title={`Regenerate ${count} ${count === 1 ? 'draft' : 'drafts'}?`}
          description="The existing captions will be replaced. Any manual edits you haven't approved yet will be lost."
          confirmLabel="Regenerate"
          onConfirm={() =>
            new Promise<void>((resolve) => {
              runAction('regen', bulkRegenerateAction, 'Regenerated')
              resolve()
            })
          }
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10 disabled:opacity-50"
            >
              {activeAction === 'regen' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regenerate
            </button>
          )}
        />

        {/* Mark as published */}
        <button
          type="button"
          onClick={() => runAction('export', bulkExportAction, 'Marked exported:', 'exported')}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-50 disabled:opacity-50"
        >
          {activeAction === 'export' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Mark exported
        </button>

        {banner && (
          <div
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${
              banner.kind === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {banner.kind === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {banner.text}
          </div>
        )}
      </div>
    </div>
  )
}
