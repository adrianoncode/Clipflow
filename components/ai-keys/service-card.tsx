'use client'

import { useState } from 'react'
import { Check, ExternalLink, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DeleteAiKeyButton } from '@/components/ai-keys/delete-ai-key-button'
import { AddServiceKeyDialog } from '@/components/ai-keys/add-service-key-dialog'
import type { ServiceSpec } from '@/components/ai-keys/service-directory'
import type { AiKeySummary } from '@/lib/ai/get-ai-keys'

interface ServiceCardProps {
  spec: ServiceSpec
  connectedKeys: AiKeySummary[]
  workspaceId: string
  /** Owner-only can add/remove keys. */
  isOwner: boolean
}

/**
 * One row per BYOK service — always renders, whether connected or not.
 * Connected state: shows the masked key(s) + delete buttons.
 * Not-connected state: shows an outline "Connect" button + quick links
 * to the provider signup + key-dashboard pages so the user can self-
 * serve without bouncing between docs.
 */
export function ServiceCard({
  spec,
  connectedKeys,
  workspaceId,
  isOwner,
}: ServiceCardProps) {
  const [adding, setAdding] = useState(false)
  const isConnected = connectedKeys.length > 0

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card transition-colors hover:border-border">
      <div className="flex items-start gap-4 p-5">
        {/* Monogram chip */}
        <div
          className={
            isConnected
              ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary ring-1 ring-primary/20'
              : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/80 font-mono text-sm font-bold text-muted-foreground ring-1 ring-border/80'
          }
        >
          {spec.monogram}
        </div>

        {/* Title + description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">{spec.name}</h4>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Check className="h-3 w-3" strokeWidth={3} />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-dashed border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Not connected
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {spec.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
            <span>{spec.costHint}</span>
            {spec.freeTierNote ? (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-primary/80">{spec.freeTierNote}</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Action area */}
        {isOwner ? (
          <div className="flex shrink-0 items-center gap-2">
            {isConnected ? null : (
              <>
                <a
                  href={spec.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden items-center gap-1 text-[11px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:inline-flex"
                >
                  Signup
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Button size="sm" onClick={() => setAdding(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Connect
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Connected keys row(s) */}
      {isConnected ? (
        <div className="border-t border-border/60 bg-muted/20 px-5 py-3">
          <ul className="space-y-2">
            {connectedKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-muted-foreground">
                    {key.masked_preview ?? '••••'}
                  </span>
                  {key.label ? (
                    <span className="truncate text-muted-foreground/80">
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
            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Add another
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {adding ? (
        <AddServiceKeyDialog
          spec={spec}
          workspaceId={workspaceId}
          onClose={() => setAdding(false)}
        />
      ) : null}
    </div>
  )
}
