'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { saveManualTokenAction } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import type { SchedulerActionState } from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import type { SocialAccountRow } from '@/lib/scheduler/get-social-accounts'

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}

interface ConnectPlatformCardProps {
  platform: string
  label: string
  emoji: string
  devPortalUrl: string
  instructions: string
  workspaceId: string
  connectedAccount: SocialAccountRow | null
}

export function ConnectPlatformCard({
  platform,
  label,
  emoji,
  devPortalUrl,
  instructions,
  workspaceId,
  connectedAccount,
}: ConnectPlatformCardProps) {
  const [showForm, setShowForm] = useState(false)
  const [state, formAction] = useFormState<SchedulerActionState, FormData>(
    saveManualTokenAction,
    {},
  )

  const isConnected = !!connectedAccount

  return (
    <div className="rounded-lg border bg-background p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-medium">{label}</p>
            {isConnected ? (
              <p className="text-xs text-green-600">
                Connected{connectedAccount.platform_username ? ` as @${connectedAccount.platform_username}` : ''}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Not connected</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          {isConnected ? 'Update token' : 'Connect'}
        </button>
      </div>

      {/* Expandable form */}
      {showForm && (
        <div className="space-y-3 border-t pt-3">
          {/* Instructions */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
              How to connect {label} ▸
            </summary>
            <div className="mt-2 space-y-2 pl-1">
              <p className="text-xs text-muted-foreground">{instructions}</p>
              <a
                href={devPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-primary underline underline-offset-4"
              >
                Open {label} Developer Portal &rarr;
              </a>
            </div>
          </details>

          {/* Token form */}
          <form action={formAction} className="space-y-2">
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <input type="hidden" name="platform" value={platform} />

            <div>
              <label className="mb-1 block text-xs font-medium">Username / handle</label>
              <input
                name="username"
                type="text"
                placeholder={`@your${label.toLowerCase()}handle`}
                defaultValue={connectedAccount?.platform_username ?? ''}
                required
                className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Access token</label>
              <input
                name="access_token"
                type="password"
                placeholder="Paste your access token"
                required
                className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {state.ok === false && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
            {state.ok === true && (
              <p className="text-xs text-green-600">{state.message ?? 'Saved!'}</p>
            )}

            <div className="flex items-center gap-2">
              <SaveButton />
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
