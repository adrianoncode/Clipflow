'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Badge } from '@/components/ui/badge'
import { FormMessage } from '@/components/ui/form-message'
import {
  transitionOutputStateAction,
  type TransitionOutputStateState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { OutputState } from '@/lib/supabase/types'

interface StateTransitionPillsProps {
  outputId: string
  workspaceId: string
  currentState: OutputState | null
}

const STATE_LABELS: Record<OutputState, string> = {
  draft: 'Draft',
  review: 'In Review',
  approved: 'Approved',
  exported: 'Published',
}

const ALLOWED_TRANSITIONS: Record<OutputState, OutputState[]> = {
  draft: ['review'],
  review: ['draft', 'approved'],
  approved: ['review', 'exported'],
  exported: ['approved'],
}

const STATE_ORDER: OutputState[] = ['draft', 'review', 'approved', 'exported']

const initialState: TransitionOutputStateState = {}

function PillButton({
  state,
  isActive,
  isReachable,
}: {
  state: OutputState
  isActive: boolean
  isReachable: boolean
}) {
  const { pending } = useFormStatus()

  if (isActive) {
    return (
      <Badge variant="default" className="cursor-default">
        {STATE_LABELS[state]}
      </Badge>
    )
  }
  if (isReachable) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Badge
          variant="outline"
          className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {STATE_LABELS[state]}
        </Badge>
      </button>
    )
  }
  return (
    <Badge variant="secondary" className="cursor-default opacity-40">
      {STATE_LABELS[state]}
    </Badge>
  )
}

function SinglePillForm({
  outputId,
  workspaceId,
  targetState,
  currentState,
}: {
  outputId: string
  workspaceId: string
  targetState: OutputState
  currentState: OutputState
}) {
  const [state, formAction] = useFormState(transitionOutputStateAction, initialState)
  const isActive = currentState === targetState
  const isReachable = !isActive && (ALLOWED_TRANSITIONS[currentState] ?? []).includes(targetState)

  return (
    <form action={formAction}>
      <input type="hidden" name="output_id" value={outputId} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="new_state" value={targetState} />
      <PillButton state={targetState} isActive={isActive} isReachable={isReachable} />
      {state.ok === false && (
        <FormMessage variant="error" className="mt-1 text-xs">
          {state.error}
        </FormMessage>
      )}
    </form>
  )
}

export function StateTransitionPills({
  outputId,
  workspaceId,
  currentState,
}: StateTransitionPillsProps) {
  const resolved: OutputState = currentState ?? 'draft'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATE_ORDER.map((state) => (
        <SinglePillForm
          key={state}
          outputId={outputId}
          workspaceId={workspaceId}
          targetState={state}
          currentState={resolved}
        />
      ))}
    </div>
  )
}
