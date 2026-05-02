'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'

import {
  bulkDeleteContentAction,
} from '@/app/(app)/workspace/[id]/content/bulk-actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface BulkActionBarProps {
  workspaceId: string
  selected: Set<string>
  onClear: () => void
}

type Banner =
  | { kind: 'success'; text: string }
  | { kind: 'error'; text: string }
  | null

export function BulkActionBar({
  workspaceId,
  selected,
  onClear,
}: BulkActionBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    },
    [],
  )

  const count = selected.size
  if (count === 0) return null

  function buildFormData(extra: Record<string, string | null>): FormData {
    const fd = new FormData()
    fd.set('workspace_id', workspaceId)
    fd.set('content_ids', Array.from(selected).join(','))
    for (const [k, v] of Object.entries(extra)) {
      if (v !== null) fd.set(k, v)
    }
    return fd
  }

  function runDelete() {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await bulkDeleteContentAction({}, buildFormData({}))
        if (result.ok === true) {
          setBanner({
            kind: 'success',
            text:
              result.failed && result.failed > 0
                ? `Deleted ${result.count} · ${result.failed} failed`
                : `Deleted ${result.count} ${result.count === 1 ? 'video' : 'videos'}`,
          })
          onClear()
          router.refresh()
        } else if (result.ok === false) {
          setBanner({ kind: 'error', text: result.error })
        }
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
        clearTimerRef.current = setTimeout(() => setBanner(null), 3000)
        resolve()
      })
    })
  }

  const deleteLabel = count === 1 ? '1 video' : `${count} videos`

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6">
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/70 bg-background/95 p-1.5 shadow-xl shadow-black/[0.12] backdrop-blur-md"
        role="toolbar"
        aria-label="Bulk actions"
      >
        {/* Count + clear */}
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear selection (${count} item${count === 1 ? '' : 's'})`}
          className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <X className="h-3 w-3" aria-hidden />
          {count} selected
        </button>

        <span aria-hidden className="mx-0.5 h-5 w-px bg-border/60" />

        {/* Delete */}
        <ConfirmDialog
          tone="destructive"
          title={`Delete ${deleteLabel}?`}
          description="Drafts, transcripts, and render history for the selected items will be removed. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={runDelete}
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-destructive transition-all hover:bg-destructive/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              )}
              Delete
            </button>
          )}
        />

        {/* Status banner — slides in next to the bar */}
        {banner && (
          <div
            role={banner.kind === 'success' ? 'status' : 'alert'}
            aria-live={banner.kind === 'success' ? 'polite' : 'assertive'}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${
              banner.kind === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {banner.kind === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />
            )}
            {banner.text}
          </div>
        )}
      </div>
    </div>
  )
}
