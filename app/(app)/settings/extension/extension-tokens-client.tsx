'use client'

import * as React from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import {
  mintExtensionTokenAction,
  revokeExtensionTokenAction,
  type MintTokenState,
  type RevokeTokenState,
} from './actions'
import type { ExtensionTokenSummary } from '@/lib/extension-tokens'

const initialMint: MintTokenState = {}
const initialRevoke: RevokeTokenState = {}

/**
 * Token-management UI. The plaintext is never present in the SSR HTML —
 * it only appears in `mintState.plaintext` after the user submits the
 * mint form, and that state is held by the client component, not
 * persisted anywhere reachable by view-source / Sentry replay of
 * subsequent renders.
 */
export function ExtensionTokensClient({
  tokens: initialTokens,
}: {
  tokens: ExtensionTokenSummary[]
}) {
  const [mintState, mintAction] = useFormState(mintExtensionTokenAction, initialMint)
  // We don't actually use revokeState's value, but useFormState gives us
  // the action wrapper that automatically revalidates the page on
  // submit. The list re-renders from server data after each call.
  const [, revokeAction] = useFormState(revokeExtensionTokenAction, initialRevoke)

  const justMinted = mintState.ok === true ? mintState : null

  return (
    <div className="space-y-6">
      {/* New-token form */}
      <form action={mintAction} className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="ext-token-name">
          Create a new extension token
        </label>
        <div className="flex gap-2">
          <input
            id="ext-token-name"
            name="name"
            type="text"
            placeholder="e.g. MacBook · Chrome"
            maxLength={80}
            required
            className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <MintButton />
        </div>
        {mintState.ok === false && (
          <p className="text-xs text-destructive">{mintState.error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Each browser × machine should have its own token so you can
          revoke a single one if a device is lost.
        </p>
      </form>

      {/* Just-minted plaintext — show ONCE, then user has to mint a new one */}
      {justMinted && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            Copy this token now — you won&rsquo;t be able to see it again.
          </p>
          <div className="mt-2 flex items-center gap-2 rounded bg-background p-2">
            <code className="flex-1 break-all font-mono text-xs">
              {justMinted.plaintext}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(justMinted.plaintext)
              }}
              className="rounded border bg-card px-2 py-1 text-xs hover:bg-muted"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Existing tokens */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Active tokens</h3>
        {initialTokens.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No tokens yet. Create one above to get started.
          </p>
        ) : (
          <ul className="divide-y divide-border/40 rounded-md border border-border/40">
            {initialTokens.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Created {fmtDate(t.createdAt)}
                    {t.lastUsedAt
                      ? ` · last used ${fmtDate(t.lastUsedAt)}`
                      : ' · never used'}
                    {t.revokedAt ? ` · revoked ${fmtDate(t.revokedAt)}` : ''}
                  </p>
                </div>
                {!t.revokedAt && (
                  <form action={revokeAction}>
                    <input type="hidden" name="tokenId" value={t.id} />
                    <RevokeButton />
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function MintButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Creating…' : 'Create token'}
    </button>
  )
}

function RevokeButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded border border-border/60 bg-card px-2 py-1 text-xs text-destructive transition-colors hover:bg-muted disabled:opacity-50"
    >
      {pending ? 'Revoking…' : 'Revoke'}
    </button>
  )
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
