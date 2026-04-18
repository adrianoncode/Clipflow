'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createTeamWorkspaceAction,
  type WorkspaceState,
} from '@/app/(onboarding)/onboarding/workspace/actions'

const initialState: WorkspaceState = {}

// Legacy note: the form's DB action lives under `createTeamWorkspaceAction`
// for schema reasons (it was originally the shared team+agency form).
// The onboarding role step only offers 'agency' now, so this component
// is agency-only. The `team` role stays in the Zod enum for grandfathered
// users only.
interface WorkspaceTeamFormProps {
  roleType: 'team' | 'agency'
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating…' : `${label} →`}
    </Button>
  )
}

function LivePreview({ name }: { name: string }) {
  const displayName = name.trim() || 'Acme Studio'
  const initial = displayName.charAt(0).toUpperCase()
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-zinc-50/60 p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Preview
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white p-2.5 shadow-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary ring-1 ring-primary/20">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Studio · multi-client
          </p>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/50">
          new
        </span>
      </div>
    </div>
  )
}

export function WorkspaceTeamForm({ roleType }: WorkspaceTeamFormProps) {
  const [state, formAction] = useFormState(
    createTeamWorkspaceAction,
    initialState,
  )
  const [name, setName] = useState('')

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="role_type" value={roleType} />
      <div className="space-y-2">
        <Label htmlFor="name">Studio name</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Studio"
          maxLength={80}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          This is your home workspace. You can add client workspaces later from
          the sidebar.
        </p>
        <LivePreview name={name} />
      </div>
      {state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}
      <SubmitButton label="Create studio workspace" />
    </form>
  )
}
