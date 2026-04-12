'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  createInviteAction,
  revokeInviteAction,
  updateMemberRoleAction,
  removeMemberAction,
  type CreateInviteState,
  type RevokeInviteState,
  type UpdateMemberRoleState,
  type RemoveMemberState,
} from '@/app/(app)/workspace/[id]/members/actions'
import type { WorkspaceMember, WorkspaceInvite } from '@/lib/members/get-workspace-members'

interface MembersPanelProps {
  workspaceId: string
  members: WorkspaceMember[]
  invites: WorkspaceInvite[]
  isOwner: boolean
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
  client: 'Client',
}

function InviteSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Creating…' : 'Create invite link'}
    </Button>
  )
}

function SmallSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending} className="text-xs">
      {pending ? pendingLabel : label}
    </Button>
  )
}

const initialInvite: CreateInviteState = {}
const initialRevoke: RevokeInviteState = {}
const initialUpdateRole: UpdateMemberRoleState = {}
const initialRemove: RemoveMemberState = {}

export function MembersPanel({ workspaceId, members, invites, isOwner }: MembersPanelProps) {
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [inviteState, inviteAction] = useFormState(
    async (prev: CreateInviteState, formData: FormData) => {
      const result = await createInviteAction(prev, formData)
      if (result.ok === true) setNewToken(result.token)
      return result
    },
    initialInvite,
  )
  const [revokeState, revokeAction] = useFormState(revokeInviteAction, initialRevoke)
  const [updateRoleState, updateRoleAction] = useFormState(updateMemberRoleAction, initialUpdateRole)
  const [removeState, removeAction] = useFormState(removeMemberAction, initialRemove)

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-8">
      {/* Current members */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Current members ({members.length})</h2>
        <ul className="divide-y rounded-md border">
          {members.map((member) => (
            <li key={member.user_id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.full_name ?? member.email ?? 'Unknown'}
                </p>
                {member.full_name && member.email && (
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                )}
              </div>

              {isOwner && member.role !== 'owner' ? (
                <form action={updateRoleAction} className="flex items-center gap-1">
                  <input type="hidden" name="workspace_id" value={workspaceId} />
                  <input type="hidden" name="user_id" value={member.user_id} />
                  <select
                    name="role"
                    defaultValue={member.role}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                    <option value="client">Client</option>
                  </select>
                </form>
              ) : (
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              )}

              {isOwner && member.role !== 'owner' && (
                <form
                  action={removeAction}
                  onSubmit={(e) => {
                    if (!window.confirm(`Remove ${member.email ?? 'this member'} from the workspace?`)) {
                      e.preventDefault()
                    }
                  }}
                >
                  <input type="hidden" name="workspace_id" value={workspaceId} />
                  <input type="hidden" name="user_id" value={member.user_id} />
                  <SmallSubmitButton label="Remove" pendingLabel="…" />
                </form>
              )}
            </li>
          ))}
        </ul>
        {(updateRoleState.ok === false && updateRoleState.error) ||
        (removeState.ok === false && removeState.error) ? (
          <FormMessage variant="error" className="text-xs">
            {updateRoleState.ok === false ? updateRoleState.error : removeState.ok === false ? removeState.error : ''}
          </FormMessage>
        ) : null}
      </div>

      {/* Invite section — owners only */}
      {isOwner && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Invite someone</h2>

          <form action={inviteAction} className="space-y-3">
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                name="email"
                type="email"
                placeholder="email@example.com (optional)"
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                name="role"
                className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
                <option value="client">Client</option>
              </select>
            </div>
            {inviteState.ok === false && inviteState.error ? (
              <FormMessage variant="error" className="text-xs">{inviteState.error}</FormMessage>
            ) : null}
            <InviteSubmitButton />
          </form>

          {/* New invite link */}
          {newToken && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-2">
              <p className="text-xs font-medium text-emerald-700">Invite link created — valid for 7 days</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                  {typeof window !== 'undefined' ? `${window.location.origin}/invite/${newToken}` : `/invite/${newToken}`}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyLink(newToken)}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Send this link to the person you want to invite. They will need to create an account or log in.</p>
            </div>
          )}

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Pending invites</p>
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs">
                      {invite.email ?? 'Anyone with the link'}
                      {' · '}
                      <span className="text-muted-foreground">{ROLE_LABELS[invite.role]}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => copyLink(invite.token)}>
                    Copy link
                  </Button>
                  <form action={revokeAction}>
                    <input type="hidden" name="workspace_id" value={workspaceId} />
                    <input type="hidden" name="invite_id" value={invite.id} />
                    <SmallSubmitButton label="Revoke" pendingLabel="…" />
                  </form>
                </div>
              ))}
              {revokeState.ok === false && revokeState.error ? (
                <FormMessage variant="error" className="text-xs">{revokeState.error}</FormMessage>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
