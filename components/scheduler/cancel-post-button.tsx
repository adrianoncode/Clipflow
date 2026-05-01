'use client'

import { useRef } from 'react'
import { useFormState } from 'react-dom'

import { cancelScheduledPostAction } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import type { SchedulerActionState } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface CancelPostButtonProps {
  postId: string
  workspaceId: string
}

/**
 * Cancel a scheduled post. Wrapped in `ConfirmDialog` because cancel is
 * effectively destructive — the row is removed from the queue and the
 * scheduled time is gone. Without the confirm step, a misclick on a
 * tightly-packed schedule list silently kills a post.
 */
export function CancelPostButton({ postId, workspaceId }: CancelPostButtonProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useFormState<SchedulerActionState, FormData>(
    cancelScheduledPostAction,
    {},
  )

  if (state.ok === true) {
    return <span className="shrink-0 text-xs text-muted-foreground">Cancelled</span>
  }

  return (
    <>
      {/* Mounted form the dialog submits — keeps the button itself
          decoupled from the action lifecycle. */}
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="post_id" value={postId} />
        <input type="hidden" name="workspace_id" value={workspaceId} />
      </form>
      <ConfirmDialog
        tone="destructive"
        title="Cancel this scheduled post?"
        description="The post will be removed from the queue. You can re-schedule the draft from the pipeline."
        confirmLabel="Cancel post"
        cancelLabel="Keep scheduled"
        onConfirm={() => formRef.current?.requestSubmit()}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className="shrink-0 rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            Cancel
          </button>
        )}
      />
      {state.ok === false && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </>
  )
}
