'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Loader2, Wand2 } from 'lucide-react'

import {
  autoDistributeApprovedAction,
  type AutoDistributeState,
} from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'

/**
 * Auto-distribute approved drafts across the upcoming week's best-time
 * slots. Uses the deterministic planner pass (pickCandidateSlots +
 * attachDraftsToSlots) — same engine the AI Plan tab uses for its
 * cold-start suggestions, but without the LLM polish call. Free, fast,
 * no API tokens.
 *
 * Lives inside the Unscheduled sidebar on the Calendar view: the user
 * sees the queue of approved drafts, hits this button, the rows flip
 * to scheduled and the calendar refreshes via revalidatePath.
 */
const initial: AutoDistributeState = {}

export function AutoDistributeButton({
  workspaceId,
  count,
}: {
  workspaceId: string
  /** Number of unscheduled approved drafts — used for the label and
   *  to disable the button when there's nothing to distribute. */
  count: number
}) {
  const [state, action] = useFormState(autoDistributeApprovedAction, initial)
  const disabled = count === 0

  return (
    <form action={action} className="space-y-1.5">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <SubmitButton count={count} disabled={disabled} />
      {state.ok ? (
        <p className="rounded-md bg-emerald-50 px-2 py-1 text-[10.5px] font-medium text-emerald-700">
          Scheduled {state.scheduled ?? 0} draft
          {state.scheduled === 1 ? '' : 's'} across this week.
        </p>
      ) : null}
      {state.ok === false && state.error ? (
        <p className="rounded-md bg-amber-50 px-2 py-1 text-[10.5px] font-medium text-amber-800">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}

function SubmitButton({ count, disabled }: { count: number; disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="group inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0F0F0F] px-3 py-2 text-[11.5px] font-bold tracking-tight text-[#D6FF3E] transition-all hover:-translate-y-px hover:bg-[#1A0F2A] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      style={{
        fontFamily:
          'var(--font-inter-tight), var(--font-inter), sans-serif',
      }}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Wand2 className="h-3 w-3" />
      )}
      {pending
        ? 'Distributing…'
        : count > 0
          ? `Auto-distribute ${count} across week`
          : 'Auto-distribute'}
    </button>
  )
}
