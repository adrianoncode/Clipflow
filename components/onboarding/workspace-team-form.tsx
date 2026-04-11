'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createTeamWorkspaceAction,
  type WorkspaceState,
} from '@/app/(onboarding)/onboarding/workspace/actions'

const initialState: WorkspaceState = {}

interface WorkspaceTeamFormProps {
  roleType: 'team' | 'agency'
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating…' : label}
    </Button>
  )
}

export function WorkspaceTeamForm({ roleType }: WorkspaceTeamFormProps) {
  const [state, formAction] = useFormState(createTeamWorkspaceAction, initialState)

  const placeholder = roleType === 'team' ? 'Acme Studios' : 'Acme Agency'
  const label = roleType === 'team' ? 'Create team workspace' : 'Create agency workspace'

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role_type" value={roleType} />
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder={placeholder}
          maxLength={80}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          {roleType === 'agency'
            ? 'This is your agency workspace. You can add client workspaces later.'
            : 'This is where your team will collaborate on content.'}
        </p>
      </div>
      {state.error ? <FormMessage variant="error">{state.error}</FormMessage> : null}
      <SubmitButton label={label} />
    </form>
  )
}
