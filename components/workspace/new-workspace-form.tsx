'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { createWorkspaceAction, type NewWorkspaceState } from '@/app/(app)/workspace/new/actions'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creating…' : label}
    </Button>
  )
}

const initial: NewWorkspaceState = {}

interface NewWorkspaceFormProps {
  /** When 'client', the form pre-fills as a client workspace, drops the
   * legacy 'team' option, and flips labels to the agency mental model. */
  defaultTypeHint?: 'client'
}

export function NewWorkspaceForm({ defaultTypeHint }: NewWorkspaceFormProps = {}) {
  const [state, action] = useFormState(createWorkspaceAction, initial)
  const isClient = defaultTypeHint === 'client'

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-card p-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">{isClient ? 'Client name' : 'Workspace name'}</Label>
        <Input
          id="name"
          name="name"
          placeholder={
            isClient
              ? "e.g. Acme Co, Nike Europe, Dr. Hansen's clinic"
              : 'e.g. Acme Agency, Personal Brand, Side Project'
          }
          maxLength={80}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue={isClient ? 'client' : 'personal'}
          className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="personal">Personal — for your own brand</option>
          <option value="client">Client — a dedicated client workspace</option>
        </select>
      </div>

      {state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}

      <SubmitButton label={isClient ? 'Add client' : 'Create workspace'} />
    </form>
  )
}
