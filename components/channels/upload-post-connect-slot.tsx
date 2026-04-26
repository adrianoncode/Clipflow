'use client'

import { useState } from 'react'
import { ExternalLink, Key, Plus } from 'lucide-react'

import { AddServiceKeyDialog } from '@/components/ai-keys/add-service-key-dialog'
import { DeleteAiKeyButton } from '@/components/ai-keys/delete-ai-key-button'
import type { ServiceSpec } from '@/components/ai-keys/service-directory'
import type { AiKeySummary } from '@/lib/ai/get-ai-keys'

interface UploadPostConnectSlotProps {
  spec: ServiceSpec
  connectedKeys: AiKeySummary[]
  workspaceId: string
  isOwner: boolean
}

/**
 * Minimal connect slot for the right column of the Upload-Post bundle
 * card. The full <ServiceCard /> we used before included monogram +
 * title + body + features + signup link + key list — way too much
 * content for a 280px sidebar, where everything wrapped one word per
 * line. Everything except the connection mechanics is already covered
 * by the bundle card's left column, so this only renders:
 *   - The connect CTA (or list of saved keys when connected)
 *   - The "Get your key" external link
 */
export function UploadPostConnectSlot({
  spec,
  connectedKeys,
  workspaceId,
  isOwner,
}: UploadPostConnectSlotProps) {
  const [adding, setAdding] = useState(false)
  const isConnected = connectedKeys.length > 0

  return (
    <div className="flex flex-col gap-3">
      {isConnected ? (
        <>
          <ul className="space-y-1.5">
            {connectedKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/40 px-2.5 py-1.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Key className="h-3 w-3 shrink-0 text-emerald-600" />
                  <span className="truncate font-mono text-[11px] text-foreground">
                    {key.masked_preview ?? '••••••••••••'}
                  </span>
                  {key.label ? (
                    <span className="truncate text-[11px] text-muted-foreground">
                      · {key.label}
                    </span>
                  ) : null}
                </div>
                {isOwner ? (
                  <DeleteAiKeyButton
                    keyId={key.id}
                    workspaceId={workspaceId}
                    label={key.label ?? spec.name}
                  />
                ) : null}
              </li>
            ))}
          </ul>
          {isOwner ? (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/60 bg-background px-2.5 text-[11px] font-semibold text-foreground transition-all hover:-translate-y-px hover:border-border hover:shadow-sm"
              >
                <Plus className="h-3 w-3" />
                Add key
              </button>
              <a
                href={spec.keyDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 transition-colors hover:text-primary"
              >
                Manage
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {isOwner ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:shadow-md"
            >
              <Plus className="h-3.5 w-3.5" />
              Connect Upload-Post
            </button>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-[11.5px] text-muted-foreground">
              Only workspace owners can connect keys.
            </div>
          )}
          <a
            href={spec.signupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 transition-colors hover:text-primary"
          >
            Get your key
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </>
      )}

      {adding && (
        <AddServiceKeyDialog
          spec={spec}
          workspaceId={workspaceId}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}
