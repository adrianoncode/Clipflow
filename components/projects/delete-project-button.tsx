'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  deleteProjectAction,
  type DeleteProjectState,
} from '@/app/(app)/workspace/[id]/projects/actions'

interface DeleteProjectButtonProps {
  workspaceId: string
  projectId: string
}

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete project'}
    </Button>
  )
}

const initial: DeleteProjectState = {}

export function DeleteProjectButton({ workspaceId, projectId }: DeleteProjectButtonProps) {
  const [state, action] = useFormState(deleteProjectAction, initial)

  return (
    <div className="space-y-1">
      <form
        action={action}
        onSubmit={(e) => {
          if (!window.confirm('Delete this project? Content items will not be deleted, just unassigned.')) {
            e.preventDefault()
          }
        }}
      >
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="project_id" value={projectId} />
        <DeleteButton />
      </form>
      {state.ok === false && state.error ? (
        <FormMessage variant="error" className="text-xs">{state.error}</FormMessage>
      ) : null}
    </div>
  )
}
