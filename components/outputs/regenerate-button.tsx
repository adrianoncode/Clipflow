'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  generateOutputsAction,
  type GenerateOutputsState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'

const initialState: GenerateOutputsState = {}

interface RegenerateButtonProps {
  workspaceId: string
  contentId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? 'Regenerating…' : 'Regenerate all'}
    </Button>
  )
}

export function RegenerateButton({ workspaceId, contentId }: RegenerateButtonProps) {
  const [state, formAction] = useFormState(generateOutputsAction, initialState)

  const hardError =
    state && state.ok === false
      ? { code: state.code, message: state.error }
      : state && 'error' in state && state.error
        ? { code: 'unknown' as const, message: state.error }
        : null

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm('This replaces all existing drafts. Continue?')) {
          event.preventDefault()
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="content_id" value={contentId} />
      <SubmitButton />
      {hardError ? (
        <FormMessage variant="error">
          {hardError.message}
          {hardError.code === 'no_key' ? (
            <>
              {' '}
              <Link href="/settings/ai-keys" className="underline">
                Add an API key
              </Link>
              .
            </>
          ) : null}
        </FormMessage>
      ) : null}
    </form>
  )
}
