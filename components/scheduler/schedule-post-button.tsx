'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { schedulePostAction } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import type { SchedulerActionState } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? 'Scheduling…' : 'Schedule post'}
    </button>
  )
}

interface SchedulePostButtonProps {
  outputId: string
  workspaceId: string
  platform: string
}

export function SchedulePostButton({ outputId, workspaceId, platform }: SchedulePostButtonProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useFormState<SchedulerActionState, FormData>(
    schedulePostAction,
    {},
  )

  if (state.ok === true) {
    return (
      <p className="flex items-center gap-1 text-xs text-green-600">
        <span>&#x2713;</span>
        <span>{state.message ?? 'Scheduled'}</span>
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <span>&#x1F4C5;</span> Schedule
      </button>
    )
  }

  return (
    <form action={formAction} className="w-full space-y-2 rounded-md border bg-muted/30 p-3">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="output_id" value={outputId} />
      <input type="hidden" name="platform" value={platform} />

      <div>
        <label className="mb-1 block text-xs font-medium">Schedule for</label>
        <input
          name="scheduled_for"
          type="datetime-local"
          required
          min={new Date().toISOString().slice(0, 16)}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Platform: <span className="font-medium capitalize">{platform.replace('_', ' ')}</span>
      </p>

      {state.ok === false && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <div className="flex items-center gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
