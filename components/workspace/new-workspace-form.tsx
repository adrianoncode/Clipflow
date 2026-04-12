'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { createWorkspaceAction, type NewWorkspaceState } from '@/app/(app)/workspace/new/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creating…' : 'Create workspace'}
    </Button>
  )
}

const initial: NewWorkspaceState = {}

export function NewWorkspaceForm() {
  const [state, action] = useFormState(createWorkspaceAction, initial)

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-card p-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Acme Agency, Personal Brand, Side Project"
          maxLength={80}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue="personal"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="personal">Personal — for your own brand</option>
          <option value="team">Team — collaborate with teammates</option>
          <option value="client">Client — a dedicated client workspace</option>
        </select>
      </div>

      {state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}

      <SubmitButton />
    </form>
  )
}
