'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { RefreshCcw } from 'lucide-react'

import { retryFailedPostAction } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import type { SchedulerActionState } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
    >
      <RefreshCcw className={pending ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} aria-hidden />
      {pending ? 'Re-queuing…' : 'Retry now'}
    </button>
  )
}

interface Props {
  postId: string
  workspaceId: string
}

/**
 * Retry button for posts that exhausted their automatic backoff and
 * landed in `status='failed'`. Without this, the user saw the error
 * message but had no recovery path — they'd have to delete and
 * re-schedule from the pipeline. The action flips status back to
 * scheduled, snaps `scheduled_for` to ~1 minute out so the cron
 * picks it up on the next tick.
 */
export function RetryFailedButton({ postId, workspaceId }: Props) {
  const [state, formAction] = useFormState<SchedulerActionState, FormData>(
    retryFailedPostAction,
    {},
  )

  if (state.ok === true) {
    return (
      <span className="text-[11px] text-emerald-600">
        {state.message ?? 'Re-queued.'}
      </span>
    )
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="post_id" value={postId} />
      <SubmitBtn />
      {state.ok === false && (
        <span className="text-[11px] text-destructive">{state.error}</span>
      )}
    </form>
  )
}
