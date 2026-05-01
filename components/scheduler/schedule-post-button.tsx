'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Calendar, Check } from 'lucide-react'

import { schedulePostAction } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import type { SchedulerActionState } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cf-btn-3d cf-btn-3d-primary rounded-xl px-3 py-1.5 text-xs disabled:opacity-50"
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
      <p className="flex items-center gap-1.5 text-xs text-green-600">
        <Check className="h-3.5 w-3.5" aria-hidden />
        <span>{state.message ?? 'Scheduled'}</span>
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        <Calendar className="h-3.5 w-3.5" aria-hidden /> Schedule
      </button>
    )
  }

  return (
    <form action={formAction} className="w-full space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-3">
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
          className="w-full rounded-xl border border-border/60 bg-background px-2.5 py-1.5 text-xs transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
