'use client'

import { useState } from 'react'
import { ArrowUpRight, Plus, Sparkles } from 'lucide-react'

import { BrandLogo } from '@/components/ai-keys/brand-logo'
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
 * One row inside an AI-keys section. Designed to sit flush with the
 * SettingsSection card — no double border, no nested shadow stack.
 *
 * Layout:
 *   [logo]  Name  ·  status pill   ·  free-tier whisper
 *           description
 *           cost line                                       [Connect →]
 *
 * Connected state expands a hairline-divided sub-rail with the masked
 * preview, the manage-on-provider link, and a quiet "Add another"
 * affordance for users who rotate keys per workspace.
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
    <div
      className={`group relative transition-colors ${
        isConnected ? 'bg-emerald-50/[0.35]' : 'hover:bg-muted/[0.18]'
      }`}
    >
      {/* hairline accent on the left when connected */}
      {isConnected && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-emerald-400/0 via-emerald-400 to-emerald-400/0"
        />
      )}

      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:gap-5 sm:px-6 sm:py-6">
        <BrandLogo
          provider={spec.provider}
          size={44}
          className="transition-transform duration-300 group-hover:-rotate-[2deg] group-hover:scale-[1.04]"
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3
              className="text-[15px] font-bold leading-tight tracking-tight text-foreground"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              {spec.name}
            </h3>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/[0.12] px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border/70 bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
                Not connected
              </span>
            )}
            {!isConnected && spec.freeTierNote && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.08] px-2 py-0.5 text-[10.5px] font-semibold text-primary">
                <Sparkles className="h-2.5 w-2.5" />
                {spec.freeTierNote}
              </span>
            )}
          </div>

          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {spec.description}
          </p>

          <p className="font-mono text-[10.5px] tracking-tight text-muted-foreground/55">
            {spec.costHint}
          </p>

          {spec.publishPlatforms && spec.publishPlatforms.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {spec.publishPlatforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground"
                >
                  {platform}
                </span>
              ))}
            </div>
          )}
        </div>

        {isOwner && !isConnected && (
          <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3.5 text-[12.5px] font-bold text-background shadow-sm shadow-foreground/[0.18] transition-all hover:-translate-y-px hover:shadow-md hover:shadow-foreground/25"
            >
              <Plus className="h-3.5 w-3.5" />
              Connect
            </button>
            <a
              href={spec.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-0.5 text-[10.5px] font-medium text-muted-foreground/70 transition-colors hover:text-primary sm:justify-end"
            >
              Get a key
              <ArrowUpRight className="h-2.5 w-2.5" />
            </a>
          </div>
        )}
      </div>

      {isConnected && (
        <div className="border-t border-emerald-500/15 bg-emerald-500/[0.04] px-5 py-3 sm:px-6">
          <ul className="space-y-2">
            {connectedKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="font-mono text-[11.5px] tracking-tight text-foreground/80">
                    {key.masked_preview ?? '••••••••••••'}
                  </span>
                  {key.label && (
                    <span className="truncate rounded-full bg-background px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                      {key.label}
                    </span>
                  )}
                </div>
                {isOwner && (
                  <DeleteAiKeyButton
                    keyId={key.id}
                    workspaceId={workspaceId}
                    label={key.label ?? spec.name}
                  />
                )}
              </li>
            ))}
          </ul>

          {isOwner && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <a
                href={spec.keyDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-muted-foreground/70 transition-colors hover:text-primary"
              >
                Manage at {spec.name}
                <ArrowUpRight className="h-2.5 w-2.5" />
              </a>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground transition-all hover:-translate-y-px hover:border-foreground/30 hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Add another
              </button>
            </div>
          )}
        </div>
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

export type { ServiceCardProps }
