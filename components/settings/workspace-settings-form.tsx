'use client'

import { useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormMessage } from '@/components/ui/form-message'
import {
  updateWorkspaceAction,
  deleteWorkspaceAction,
  type UpdateWorkspaceState,
  type DeleteWorkspaceState,
} from '@/app/(app)/settings/workspace/actions'
import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'

interface WorkspaceSettingsFormProps {
  workspace: WorkspaceSummary
  isOwner: boolean
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </Button>
  )
}

const initialUpdate: UpdateWorkspaceState = {}
const initialDelete: DeleteWorkspaceState = {}

export function WorkspaceSettingsForm({ workspace, isOwner }: WorkspaceSettingsFormProps) {
  const [updateState, updateAction] = useFormState(updateWorkspaceAction, initialUpdate)
  const [deleteState, deleteAction] = useFormState(deleteWorkspaceAction, initialDelete)
  const deleteFormRef = useRef<HTMLFormElement>(null)

  return (
    <div className="space-y-8">
      {/* Update form */}
      <form action={updateAction} className="space-y-5">
        <input type="hidden" name="workspace_id" value={workspace.id} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="ws-name">
            Workspace name
          </label>
          <input
            id="ws-name"
            name="name"
            type="text"
            required
            defaultValue={workspace.name}
            disabled={!isOwner}
            className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="ws-type">
            Type
          </label>
          <select
            id="ws-type"
            name="type"
            defaultValue={workspace.type}
            disabled={!isOwner}
            className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            <option value="personal">Personal</option>
            <option value="team">Team</option>
            <option value="client">Client</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Type is cosmetic — it determines the label shown in the workspace header.
          </p>
        </div>

        {!isOwner && (
          <FormMessage variant="info">Only workspace owners can edit settings.</FormMessage>
        )}

        {updateState.ok === false && updateState.error ? (
          <FormMessage variant="error">{updateState.error}</FormMessage>
        ) : null}

        {updateState.ok === true ? (
          <FormMessage variant="success">Changes saved.</FormMessage>
        ) : null}

        {isOwner && <SaveButton />}
      </form>

      {/* Danger zone */}
      {isOwner && (
        <div className="space-y-4 rounded-lg border border-destructive/30 p-4">
          <div>
            <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Permanently deletes the workspace and all its content, outputs, and projects.
              This cannot be undone.
            </p>
          </div>

          {deleteState.ok === false && deleteState.error ? (
            <FormMessage variant="error">{deleteState.error}</FormMessage>
          ) : null}

          {/* The form lives in the DOM the entire time so the slug-typed
              confirmation input can validate the user's typed value
              before the modal even opens. ConfirmDialog still does the
              "are you sure?" gate; the input is the second layer. */}
          <form ref={deleteFormRef} action={deleteAction} className="space-y-2">
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <label htmlFor="ws-delete-slug" className="block text-xs font-medium">
              Type <code className="rounded bg-muted px-1 py-0.5 font-mono">{workspace.slug}</code> to enable the delete button.
            </label>
            <input
              id="ws-delete-slug"
              name="slug_confirmation"
              type="text"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 font-mono text-sm placeholder:text-muted-foreground/50 transition-all focus:border-destructive/60 focus:outline-none focus:ring-2 focus:ring-destructive/30"
            />
          </form>
          <ConfirmDialog
            tone="destructive"
            title={`Delete "${workspace.name}"?`}
            description="Every content item, draft, render, and project in this workspace will be permanently deleted. There is no undo."
            confirmLabel="Delete workspace"
            onConfirm={() => deleteFormRef.current?.requestSubmit()}
            trigger={(open) => (
              <Button
                type="button"
                variant="destructive"
                onClick={open}
                disabled={deleteState.ok === false && !deleteState.error}
              >
                Delete workspace
              </Button>
            )}
          />
        </div>
      )}
    </div>
  )
}
