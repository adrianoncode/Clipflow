'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { CalendarClock, CheckCircle2, X } from 'lucide-react'

import { schedulePostAction } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import type { SchedulerActionState } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'

interface ScheduleOutputDialogProps {
  outputId: string
  workspaceId: string
  platform: string
  platformLabel: string
  contentTitle: string | null
}

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="cf-btn-3d cf-btn-3d-primary flex-1 rounded-xl px-4 py-2 text-xs disabled:opacity-50"
    >
      {pending ? 'Scheduling…' : 'Schedule'}
    </button>
  )
}

export function ScheduleOutputDialog({
  outputId,
  workspaceId,
  platform,
  platformLabel,
  contentTitle,
}: ScheduleOutputDialogProps) {
  // The success-after-submit state from useFormState below sticks until
  // remount. Tracking `attempt` lets us force a "fresh" view: when the
  // user clicks "Reschedule", we bump the counter and re-key the inner
  // <Inner> component which has its own useFormState — that one ALWAYS
  // resets to {} on mount.
  const [open, setOpen] = useState(false)
  const [attempt, setAttempt] = useState(0)
  return (
    <ScheduleDialogInner
      key={attempt}
      outputId={outputId}
      workspaceId={workspaceId}
      platform={platform}
      platformLabel={platformLabel}
      contentTitle={contentTitle}
      open={open}
      setOpen={setOpen}
      onReschedule={() => {
        setAttempt((a) => a + 1)
        setOpen(true)
      }}
    />
  )
}

interface InnerProps extends ScheduleOutputDialogProps {
  open: boolean
  setOpen: (v: boolean) => void
  onReschedule: () => void
}

function ScheduleDialogInner({
  outputId,
  workspaceId,
  platform,
  platformLabel,
  contentTitle,
  open,
  setOpen,
  onReschedule,
}: InnerProps) {
  const [state, formAction] = useFormState<SchedulerActionState, FormData>(
    schedulePostAction,
    {},
  )

  // Success state — keeps the chip but offers an explicit reset path.
  // The parent bumps the `key` on this Inner component when Reschedule
  // is clicked, which remounts useFormState fresh — without that, the
  // success memory persists forever and the card becomes a dead end.
  if (state.ok === true) {
    return (
      <div className="flex flex-1 items-center justify-between gap-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3" />
          Scheduled
        </span>
        <button
          type="button"
          onClick={onReschedule}
          className="text-[10px] text-emerald-700/70 underline-offset-2 hover:underline"
        >
          Reschedule
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-[10px] font-semibold text-emerald-700 transition-all hover:bg-emerald-100"
      >
        <CalendarClock className="h-3 w-3" />
        Schedule
      </button>
    )
  }

  // Default to tomorrow 10:00
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)
  const defaultDateTime = tomorrow.toISOString().slice(0, 16)

  return (
    <div className="col-span-full mt-1">
      <form
        action={formAction}
        className="space-y-2.5 rounded-xl border border-primary/20 bg-primary/[0.03] p-3"
      >
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="output_id" value={outputId} />
        <input type="hidden" name="platform" value={platform} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold text-foreground">Schedule post</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {contentTitle && (
          <p className="truncate text-[10px] text-muted-foreground">
            {contentTitle} · <span className="font-medium capitalize">{platformLabel}</span>
          </p>
        )}

        <input
          name="scheduled_for"
          type="datetime-local"
          required
          defaultValue={defaultDateTime}
          min={new Date().toISOString().slice(0, 16)}
          className="w-full rounded-lg border border-border/60 bg-background px-2.5 py-2 text-xs font-medium transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        {state.ok === false && (
          <p className="text-[10px] text-destructive">{state.error}</p>
        )}

        <div className="flex items-center gap-2">
          <SubmitButton />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-border/50 px-3 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
