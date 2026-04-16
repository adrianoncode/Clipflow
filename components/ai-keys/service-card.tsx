'use client'

import { useState } from 'react'
import { ExternalLink, Plus, Zap, Key } from 'lucide-react'

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

// Per-provider brand colors — monogram chip background + text
const PROVIDER_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  openai:       { bg: 'bg-zinc-900',     text: 'text-white',        glow: 'shadow-zinc-900/20' },
  anthropic:    { bg: 'bg-[#d4580b]',    text: 'text-white',        glow: 'shadow-orange-500/20' },
  google:       { bg: 'bg-blue-600',     text: 'text-white',        glow: 'shadow-blue-600/20' },
  shotstack:    { bg: 'bg-violet-600',   text: 'text-white',        glow: 'shadow-violet-600/20' },
  replicate:    { bg: 'bg-indigo-600',   text: 'text-white',        glow: 'shadow-indigo-600/20' },
  elevenlabs:   { bg: 'bg-amber-400',    text: 'text-zinc-900',     glow: 'shadow-amber-400/20' },
  'upload-post':{ bg: 'bg-emerald-500',  text: 'text-white',        glow: 'shadow-emerald-500/20' },
}

function getProviderColor(provider: string) {
  return PROVIDER_COLORS[provider] ?? { bg: 'bg-primary', text: 'text-primary-foreground', glow: 'shadow-primary/20' }
}

export function ServiceCard({
  spec,
  connectedKeys,
  workspaceId,
  isOwner,
}: ServiceCardProps) {
  const [adding, setAdding] = useState(false)
  const isConnected = connectedKeys.length > 0
  const colors = getProviderColor(spec.provider)

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
        isConnected
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-background shadow-sm hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/[0.08]'
          : 'border-border/50 bg-card hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/[0.08]'
      }`}
    >
      {/* Shine sweep on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      {/* Connected accent bar */}
      {isConnected && (
        <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-emerald-400 to-emerald-500/50" />
      )}

      <div className="flex items-start gap-4 p-5">
        {/* Monogram chip */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1 ${colors.bg} ${colors.text} ${colors.glow}`}
        >
          {spec.monogram}
        </div>

        {/* Title + description */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">{spec.name}</h4>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground/70">
                Not connected
              </span>
            )}
            {spec.freeTierNote && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold text-primary/80">
                <Zap className="h-2.5 w-2.5" />
                {spec.freeTierNote}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {spec.description}
          </p>

          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/50">
            {spec.costHint}
          </p>

          {/* Platform pills for publishing services */}
          {spec.publishPlatforms && spec.publishPlatforms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {spec.publishPlatforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {platform}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action area — only for owners when not connected */}
        {isOwner && !isConnected && (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Connect
            </Button>
            <a
              href={spec.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground/60 transition-colors hover:text-primary"
            >
              Get API key
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        )}
      </div>

      {/* Connected keys footer */}
      {isConnected && (
        <div className="border-t border-emerald-100/80 bg-emerald-50/30 px-5 py-3">
          <ul className="space-y-2">
            {connectedKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100">
                    <Key className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {key.masked_preview ?? '••••••••••••'}
                  </span>
                  {key.label && (
                    <span className="truncate text-[11px] text-muted-foreground/60">
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
            <div className="mt-2.5 flex items-center justify-between">
              <a
                href={spec.keyDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/50 transition-colors hover:text-primary"
              >
                Manage at {spec.name}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
              >
                <Plus className="h-3 w-3" />
                Add key
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
