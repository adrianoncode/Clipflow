'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
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

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete workspace'}
    </Button>
  )
}

const initialUpdate: UpdateWorkspaceState = {}
const initialDelete: DeleteWorkspaceState = {}

export function WorkspaceSettingsForm({ workspace, isOwner }: WorkspaceSettingsFormProps) {
  const [updateState, updateAction] = useFormState(updateWorkspaceAction, initialUpdate)
  const [deleteState, deleteAction] = useFormState(deleteWorkspaceAction, initialDelete)

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
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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

          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (
                !window.confirm(
                  `Delete "${workspace.name}"?\n\nThis will permanently delete all content, outputs, and projects in this workspace. There is no undo.`,
                )
              ) {
                e.preventDefault()
              }
            }}
          >
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <DeleteButton />
          </form>
        </div>
      )}
    </div>
  )
}
