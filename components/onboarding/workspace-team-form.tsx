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

function LiveTeamPreview({
  name,
  roleType,
}: {
  name: string
  roleType: 'team' | 'agency'
}) {
  const defaultName = roleType === 'agency' ? 'Acme Agency' : 'Acme Studios'
  const displayName = name.trim() || defaultName
  const initial = displayName.charAt(0).toUpperCase()
  const subtitle =
    roleType === 'agency' ? 'Agency · multi-client' : 'Team · shared workspace'
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
            {subtitle}
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

  const placeholder = roleType === 'team' ? 'Acme Studios' : 'Acme Agency'
  const label =
    roleType === 'team' ? 'Create team workspace' : 'Create agency workspace'

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="role_type" value={roleType} />
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          maxLength={80}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          {roleType === 'agency'
            ? 'This is your agency workspace. You can add client workspaces later.'
            : 'This is where your team will collaborate on content.'}
        </p>
        <LiveTeamPreview name={name} roleType={roleType} />
      </div>
      {state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}
      <SubmitButton label={label} />
    </form>
  )
}
