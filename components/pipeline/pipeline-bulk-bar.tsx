'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  Loader2,
  Send,
  Star,
  X,
} from 'lucide-react'

import {
  bulkApproveAction,
  bulkExportAction,
  bulkStarAction,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/bulk-actions'

interface PipelineBulkBarProps {
  workspaceId: string
  selected: Set<string>
  onClear: () => void
}

type Banner =
  | { kind: 'success'; text: string }
  | { kind: 'error'; text: string }
  | null

type BulkAction = typeof bulkApproveAction

export function PipelineBulkBar({ workspaceId, selected, onClear }: PipelineBulkBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const count = selected.size
  if (count === 0) return null

  function runAction(label: string, action: BulkAction, successVerb: string) {
    setActiveAction(label)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('workspace_id', workspaceId)
      fd.set('output_ids', Array.from(selected).join(','))

      const result = await action({}, fd)
      setActiveAction(null)

      if (result.ok === true) {
        setBanner({
          kind: 'success',
          text:
            result.failed && result.failed > 0
              ? `${successVerb} ${result.count} · ${result.failed} failed`
              : `${successVerb} ${result.count} ${result.count === 1 ? 'draft' : 'drafts'}`,
        })
        onClear()
        router.refresh()
      } else if (result.ok === false) {
        setBanner({ kind: 'error', text: result.error })
      }
      setTimeout(() => setBanner(null), 3000)
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
          onClick={() => runAction('approve', bulkApproveAction, 'Approved')}
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

        {/* Export */}
        <button
          type="button"
          onClick={() => runAction('export', bulkExportAction, 'Exported')}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-50 disabled:opacity-50"
        >
          {activeAction === 'export' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Export
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
