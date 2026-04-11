'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  completePersonalWorkspaceAction,
  type WorkspaceState,
} from '@/app/(onboarding)/onboarding/workspace/actions'

const initialState: WorkspaceState = {}

interface WorkspaceSoloFormProps {
  personalWorkspaceId: string
  currentName: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Saving…' : 'Continue'}
    </Button>
  )
}

export function WorkspaceSoloForm({
  personalWorkspaceId,
  currentName,
}: WorkspaceSoloFormProps) {
  const [state, formAction] = useFormState(
    completePersonalWorkspaceAction,
    initialState,
  )

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_id" value={personalWorkspaceId} />
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={currentName}
          placeholder="Personal"
          maxLength={80}
        />
        <p className="text-xs text-muted-foreground">
          You can rename this later from settings.
        </p>
      </div>
      {state.error ? <FormMessage variant="error">{state.error}</FormMessage> : null}
      <SubmitButton />
    </form>
  )
}
