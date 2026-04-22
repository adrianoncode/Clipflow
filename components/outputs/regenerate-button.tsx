'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useFormState } from 'react-dom'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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

export function RegenerateButton({ workspaceId, contentId }: RegenerateButtonProps) {
  const [state, formAction] = useFormState(generateOutputsAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  const hardError =
    state && state.ok === false
      ? { code: state.code, message: state.error }
      : state && 'error' in state && state.error
        ? { code: 'unknown' as const, message: state.error }
        : null

  return (
    <div className="space-y-3">
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
      </form>
      <ConfirmDialog
        tone="destructive"
        title="Regenerate every draft?"
        description="Every existing platform draft for this content item will be replaced. Manual edits that haven't been approved yet will be lost."
        confirmLabel="Regenerate"
        onConfirm={() => formRef.current?.requestSubmit()}
        trigger={(open) => (
          <Button type="button" variant="outline" onClick={open}>
            Regenerate all
          </Button>
        )}
      />
      {hardError ? (
        <FormMessage variant="error">
          {hardError.message}
          {hardError.code === 'no_key' ? (
            <>
              {' '}
              <Link href="/settings/ai-keys" className="underline">
                Connect your AI
              </Link>
              .
            </>
          ) : null}
        </FormMessage>
      ) : null}
    </div>
  )
}
