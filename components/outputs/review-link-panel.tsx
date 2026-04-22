'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  createReviewLinkAction,
  revokeReviewLinkAction,
  type CreateReviewLinkState,
  type RevokeReviewLinkState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/review-link-actions'
import type { ReviewLinkRow } from '@/lib/review/get-review-links-for-content'
import { copyToClipboard } from '@/lib/ui/copy-to-clipboard'

interface ReviewLinkPanelProps {
  workspaceId: string
  contentId: string
  links: ReviewLinkRow[]
}

function CreateButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Creating…' : 'Create review link'}
    </Button>
  )
}

function RevokeButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending} className="text-xs text-destructive hover:text-destructive">
      {pending ? '…' : 'Revoke'}
    </Button>
  )
}

const initialCreate: CreateReviewLinkState = {}
const initialRevoke: RevokeReviewLinkState = {}

export function ReviewLinkPanel({ workspaceId, contentId, links }: ReviewLinkPanelProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [createState, createAction] = useFormState(createReviewLinkAction, initialCreate)
  const [revokeState, revokeAction] = useFormState(revokeReviewLinkAction, initialRevoke)

  async function copyLink(token: string) {
    const url = `${window.location.origin}/review/${token}`
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopied(token)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  // Show newly created link immediately
  const newToken = createState.ok === true ? createState.token : null

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Share review link
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Client review links</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {/* Create new link */}
      <form action={createAction} className="space-y-2">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <input
          name="label"
          type="text"
          placeholder="Label (optional, e.g. 'For Client ABC')"
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {createState.ok === false && createState.error ? (
          <FormMessage variant="error" className="text-xs">{createState.error}</FormMessage>
        ) : null}
        <CreateButton />
      </form>

      {/* Newly created token — shown immediately */}
      {newToken && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-2">
          <p className="text-xs font-medium text-emerald-700">Review link created!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
              {typeof window !== 'undefined' ? `${window.location.origin}/review/${newToken}` : `/review/${newToken}`}
            </code>
            <Button variant="outline" size="sm" onClick={() => copyLink(newToken)}>
              {copied === newToken ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* Existing links */}
      {links.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Active links</p>
          {links.filter((l) => l.is_active).map((link) => (
            <div key={link.id} className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
              <div className="flex-1 min-w-0 space-y-0.5">
                {link.label && <p className="text-xs font-medium truncate">{link.label}</p>}
                <code className="text-xs text-muted-foreground truncate block">
                  /review/{link.token.slice(0, 16)}…
                </code>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyLink(link.token)} className="text-xs shrink-0">
                {copied === link.token ? 'Copied!' : 'Copy'}
              </Button>
              <form action={revokeAction}>
                <input type="hidden" name="workspace_id" value={workspaceId} />
                <input type="hidden" name="content_id" value={contentId} />
                <input type="hidden" name="link_id" value={link.id} />
                <RevokeButton />
              </form>
            </div>
          ))}
        </div>
      )}

      {revokeState.ok === false && revokeState.error ? (
        <FormMessage variant="error" className="text-xs">{revokeState.error}</FormMessage>
      ) : null}
    </div>
  )
}
