'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'

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
      {pending ? 'Saving…' : 'Continue →'}
    </Button>
  )
}

/**
 * Live mock sidebar that reflects the workspace name the user is typing.
 * Small detail but it makes the whole step feel "real" — you're not
 * just filling a form, you're watching your workspace appear.
 */
function LiveWorkspacePreview({ name }: { name: string }) {
  const displayName = name.trim() || 'Personal'
  const initial = displayName.charAt(0).toUpperCase()
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-zinc-50/60 p-3">
      <p className="mb-2 font-bold text-[10px] uppercase tracking-[0.18em] text-primary/85">
        Preview
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white p-2.5 shadow-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary ring-1 ring-primary/20">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Personal · just you
          </p>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/50">
          home
        </span>
      </div>
    </div>
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
  const [name, setName] = useState(currentName)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="workspace_id" value={personalWorkspaceId} />
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Personal"
          maxLength={80}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          You can rename this later from settings.
        </p>
        <LiveWorkspacePreview name={name} />
      </div>
      {state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}
      <SubmitButton />
    </form>
  )
}
