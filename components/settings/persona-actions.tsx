'use client'

import { useFormState } from 'react-dom'
import { Button } from '@/components/ui/button'
import {
  setActivePersonaAction,
  deletePersonaAction,
  type UpsertPersonaState,
} from '@/app/(app)/settings/personas/actions'

interface Props {
  workspaceId: string
  personaId: string
  isActive: boolean
}

export function PersonaActions({ workspaceId, personaId, isActive }: Props) {
  const initial: UpsertPersonaState = {}
  const [, activateAction] = useFormState(setActivePersonaAction, initial)
  const [, deleteAction] = useFormState(deletePersonaAction, initial)

  return (
    <div className="flex gap-2">
      <form action={activateAction}>
        <input type="hidden" name="workspace_id" value={workspaceId} />
        {!isActive && <input type="hidden" name="persona_id" value={personaId} />}
        <Button type="submit" variant="outline" size="sm">
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </form>
      <form action={deleteAction}>
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="persona_id" value={personaId} />
        <Button type="submit" variant="ghost" size="sm" className="text-destructive">
          Delete
        </Button>
      </form>
    </div>
  )
}
