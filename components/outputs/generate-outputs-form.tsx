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

interface GenerateOutputsFormProps {
  workspaceId: string
  contentId: string
  submitLabel?: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Generating…' : label}
    </Button>
  )
}

export function GenerateOutputsForm({
  workspaceId,
  contentId,
  submitLabel = 'Generate outputs',
}: GenerateOutputsFormProps) {
  const [state, formAction] = useFormState(generateOutputsAction, initialState)

  const hardError =
    state && state.ok === false
      ? { code: state.code, message: state.error }
      : state && 'error' in state && state.error
        ? { code: 'unknown' as const, message: state.error }
        : null

  const partialFailures =
    state && state.ok === true && state.failed.length > 0 ? state.failed : null

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="content_id" value={contentId} />

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

      {partialFailures ? (
        <FormMessage variant="error">
          Some platforms failed: {partialFailures.map((f) => f.platform).join(', ')}. See each
          card below for details.
        </FormMessage>
      ) : null}

      <SubmitButton label={submitLabel} />
      <p className="text-xs text-muted-foreground">
        Generating runs all four platforms in parallel. Takes 15-60 seconds depending on
        transcript length and provider latency.
      </p>
    </form>
  )
}
