'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  deleteContentAction,
  type DeleteContentState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/actions'

interface DeleteContentButtonProps {
  workspaceId: string
  contentId: string
}

function DeleteBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}
      className="text-xs text-muted-foreground hover:text-destructive">
      {pending ? 'Deleting…' : 'Delete content'}
    </Button>
  )
}

const initial: DeleteContentState = {}

export function DeleteContentButton({ workspaceId, contentId }: DeleteContentButtonProps) {
  const [state, action] = useFormState(deleteContentAction, initial)

  return (
    <div>
      <form
        action={action}
        onSubmit={(e) => {
          if (!window.confirm('Delete this content? All drafts and history will also be deleted. This cannot be undone.')) {
            e.preventDefault()
          }
        }}
      >
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <DeleteBtn />
      </form>
      {state.ok === false && state.error ? (
        <FormMessage variant="error" className="text-xs mt-1">{state.error}</FormMessage>
      ) : null}
    </div>
  )
}
