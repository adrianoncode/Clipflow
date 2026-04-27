'use client'

import { useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  updateWorkspaceAction,
  deleteWorkspaceAction,
  type UpdateWorkspaceState,
  type DeleteWorkspaceState,
} from '@/app/(app)/settings/workspace/actions'
import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'

const initialUpdate: UpdateWorkspaceState = {}
const initialDelete: DeleteWorkspaceState = {}

export function WorkspaceNameRow({
  workspace,
  isOwner,
}: {
  workspace: WorkspaceSummary
  isOwner: boolean
}) {
  const [state, action] = useFormState(updateWorkspaceAction, initialUpdate)
  const [name, setName] = useState(workspace.name)
  const dirty = name.trim() !== workspace.name.trim()

  return (
    <form action={action} className="flex w-full items-center gap-2">
      <input type="hidden" name="workspace_id" value={workspace.id} />
      <input type="hidden" name="type" value={workspace.type} />
      <input
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={!isOwner}
        maxLength={80}
        className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-[13.5px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
      />
      {isOwner ? <SaveBtn dirty={dirty} /> : null}
      {state.ok === false && state.error ? (
        <span className="ml-2 text-[11px] text-destructive">{state.error}</span>
      ) : null}
    </form>
  )
}

export function WorkspaceTypeRow({
  workspace,
  isOwner,
}: {
  workspace: WorkspaceSummary
  isOwner: boolean
}) {
  const [, action] = useFormState(updateWorkspaceAction, initialUpdate)
  const [value, setValue] = useState(workspace.type)
  const dirty = value !== workspace.type

  return (
    <form action={action} className="flex w-full items-center gap-2">
      <input type="hidden" name="workspace_id" value={workspace.id} />
      <input type="hidden" name="name" value={workspace.name} />
      <select
        name="type"
        value={value}
        onChange={(e) => setValue(e.target.value as typeof workspace.type)}
        disabled={!isOwner}
        className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-[13.5px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
      >
        <option value="personal">Personal</option>
        <option value="team">Team</option>
        <option value="client">Client</option>
      </select>
      {isOwner ? <SaveBtn dirty={dirty} /> : null}
    </form>
  )
}

function SaveBtn({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="sm"
      disabled={!dirty || pending}
      className="h-9 shrink-0 px-3 text-[12px] font-bold"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
    </Button>
  )
}

export function WorkspaceDeleteButton({
  workspace,
  isOwner,
}: {
  workspace: WorkspaceSummary
  isOwner: boolean
}) {
  const [state, action] = useFormState(deleteWorkspaceAction, initialDelete)
  const formRef = useRef<HTMLFormElement>(null)

  if (!isOwner) {
    return (
      <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/75">
        Owner-only
      </span>
    )
  }

  return (
    <>
      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="workspace_id" value={workspace.id} />
      </form>
      <ConfirmDialog
        tone="destructive"
        title={`Delete "${workspace.name}"?`}
        description="Every content item, draft, render, and project in this workspace will be permanently deleted. There is no undo."
        confirmLabel="Delete workspace"
        onConfirm={() => formRef.current?.requestSubmit()}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-3 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete workspace
          </button>
        )}
      />
      {state.ok === false && state.error ? (
        <span className="ml-2 text-[11px] text-destructive">{state.error}</span>
      ) : null}
    </>
  )
}
