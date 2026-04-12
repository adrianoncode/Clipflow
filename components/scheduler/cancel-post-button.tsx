'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { cancelScheduledPostAction } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import type { SchedulerActionState } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
    >
      {pending ? '...' : 'Cancel'}
    </button>
  )
}

interface CancelPostButtonProps {
  postId: string
  workspaceId: string
}

export function CancelPostButton({ postId, workspaceId }: CancelPostButtonProps) {
  const [state, formAction] = useFormState<SchedulerActionState, FormData>(
    cancelScheduledPostAction,
    {},
  )

  if (state.ok === true) {
    return <span className="shrink-0 text-xs text-muted-foreground">Cancelled</span>
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      {state.ok === false && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  )
}
