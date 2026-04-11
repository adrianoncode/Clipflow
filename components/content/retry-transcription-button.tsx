'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  retryTranscriptionAction,
  type RetryTranscriptionState,
} from '@/app/(app)/workspace/[id]/content/new/actions'

const initialState: RetryTranscriptionState = {}

interface RetryTranscriptionButtonProps {
  workspaceId: string
  contentId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Retrying…' : 'Retry transcription'}
    </Button>
  )
}

export function RetryTranscriptionButton({
  workspaceId,
  contentId,
}: RetryTranscriptionButtonProps) {
  const [state, formAction] = useFormState(retryTranscriptionAction, initialState)
  const error = state && state.ok === false ? state.error : state && 'error' in state ? state.error : undefined

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="content_id" value={contentId} />
      {error ? <FormMessage variant="error">{error}</FormMessage> : null}
      <SubmitButton />
    </form>
  )
}
