'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  suggestFollowUpTopicsAction,
  type SuggestFollowUpState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/actions'

function SubmitButton({ hasTopics }: { hasTopics: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? 'Thinking…' : hasTopics ? 'Regenerate' : 'Suggest topics'}
    </Button>
  )
}

interface FollowUpTopicsDialogProps {
  workspaceId: string
  contentId: string
}

const initial: SuggestFollowUpState = {}

export function FollowUpTopicsDialog({ workspaceId, contentId }: FollowUpTopicsDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(suggestFollowUpTopicsAction, initial)

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Suggest follow-up topics
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Follow-up topic suggestions</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>

      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <SubmitButton hasTopics={state.ok === true} />
        <span className="text-xs text-muted-foreground">
          AI analyzes your transcript and suggests 5 related topics.
        </span>
      </form>

      {state.ok === false && state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}

      {state.ok === true ? (
        <ol className="space-y-3">
          {state.topics.map((topic, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground w-5">
                {i + 1}.
              </span>
              <div className="space-y-0.5">
                <p className="font-medium leading-snug">{topic.title}</p>
                <p className="text-muted-foreground">{topic.angle}</p>
                <p className="text-xs text-muted-foreground/70">{topic.why}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
