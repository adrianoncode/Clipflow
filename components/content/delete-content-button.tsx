'use client'

import { useRef } from 'react'
import { useFormState } from 'react-dom'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormMessage } from '@/components/ui/form-message'
import {
  deleteContentAction,
  type DeleteContentState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/actions'

interface DeleteContentButtonProps {
  workspaceId: string
  contentId: string
}

const initial: DeleteContentState = {}

export function DeleteContentButton({ workspaceId, contentId }: DeleteContentButtonProps) {
  const [state, action] = useFormState(deleteContentAction, initial)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div>
      <form ref={formRef} action={action}>
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
      </form>
      <ConfirmDialog
        tone="destructive"
        title="Delete this content?"
        description="All drafts and history tied to this item will be deleted too. This cannot be undone."
        confirmLabel="Delete content"
        onConfirm={() => {
          // Submit the hidden form — useFormState needs a real submit event
          // to pick up FormData, so we can't call the action directly.
          formRef.current?.requestSubmit()
        }}
        trigger={(open) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={open}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Delete content
          </Button>
        )}
      />
      {state.ok === false && state.error ? (
        <FormMessage variant="error" className="text-xs mt-1">
          {state.error}
        </FormMessage>
      ) : null}
    </div>
  )
}
