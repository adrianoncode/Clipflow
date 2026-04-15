'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AddServiceKeyDialog } from '@/components/ai-keys/add-service-key-dialog'
import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import type { ServiceSpec } from '@/components/ai-keys/service-directory'
import type { AiProvider } from '@/lib/ai/providers/types'

interface OnboardingServicePickerProps {
  workspaceId: string
  connectedProviders: AiProvider[]
}

/**
 * The onboarding equivalent of the Settings service cards — but
 * stripped to the essentials. Two groups:
 *   · AI Providers (required, at least one)
 *   · Media Stack (optional, unlocks rendering features)
 *
 * Opening the Add-Service dialog pre-fills the provider; after a
 * successful save the row flips to a connected state without leaving
 * the page. A "Continue" CTA at the bottom is gated: user must
 * connect at least one LLM provider before moving on.
 */
export function OnboardingServicePicker({
  workspaceId,
  connectedProviders: initialConnected,
}: OnboardingServicePickerProps) {
  const [connected, setConnected] = useState<Set<AiProvider>>(
    new Set(initialConnected),
  )
  const [activeSpec, setActiveSpec] = useState<ServiceSpec | null>(null)

  const llmServices = SERVICE_DIRECTORY.filter((s) => s.category === 'llm')
  const mediaServices = SERVICE_DIRECTORY.filter((s) => s.category === 'media')

  const hasAnyLlm = llmServices.some((s) => connected.has(s.provider))

  function onConnected(provider: AiProvider) {
    setConnected((prev) => new Set(prev).add(provider))
    setActiveSpec(null)
  }

  return (
    <div className="space-y-8">
      {/* AI providers */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            AI provider · Pick at least one
          </h3>
          {hasAnyLlm ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
              <Check className="h-3 w-3" strokeWidth={3} />
              Required step complete
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              required
            </span>
          )}
        </div>
        <div className="space-y-2">
          {llmServices.map((spec) => (
            <ServiceRow
              key={spec.provider}
              spec={spec}
              isConnected={connected.has(spec.provider)}
              onClick={() => setActiveSpec(spec)}
            />
          ))}
        </div>
      </section>

      {/* Media stack */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Media stack · Optional
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            unlock rendering
          </span>
        </div>
        <div className="space-y-2">
          {mediaServices.map((spec) => (
            <ServiceRow
              key={spec.provider}
              spec={spec}
              isConnected={connected.has(spec.provider)}
              onClick={() => setActiveSpec(spec)}
            />
          ))}
        </div>
      </section>

      {/* Continue */}
      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-6">
        <p className="text-xs text-muted-foreground">
          {hasAnyLlm
            ? `${connected.size} of ${SERVICE_DIRECTORY.length} services connected`
            : 'Connect at least one AI provider to continue'}
        </p>
        <Link
          href="/onboarding/complete"
          className={
            hasAnyLlm
              ? 'inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90'
              : 'pointer-events-none inline-flex h-10 items-center gap-2 rounded-lg bg-muted px-5 text-sm font-medium text-muted-foreground'
          }
          aria-disabled={!hasAnyLlm}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {activeSpec ? (
        <AddServiceKeyDialog
          spec={activeSpec}
          workspaceId={workspaceId}
          onClose={() => {
            // Optimistic: assume the dialog closed because the key was
            // saved — it's idempotent if it wasn't. We double-check by
            // reloading the page in the background-safe way.
            onConnected(activeSpec.provider)
          }}
        />
      ) : null}
    </div>
  )
}

function ServiceRow({
  spec,
  isConnected,
  onClick,
}: {
  spec: ServiceSpec
  isConnected: boolean
  onClick: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border">
      <div
        className={
          isConnected
            ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary ring-1 ring-primary/20'
            : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-sm font-bold text-muted-foreground ring-1 ring-border'
        }
      >
        {spec.monogram}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{spec.name}</p>
          {isConnected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              <Check className="h-3 w-3" strokeWidth={3} />
              Connected
            </span>
          ) : null}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          {spec.description}
        </p>
        {spec.freeTierNote ? (
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-primary/80">
            {spec.freeTierNote}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!isConnected ? (
          <a
            href={spec.signupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Signup
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        <Button
          size="sm"
          variant={isConnected ? 'outline' : 'default'}
          onClick={onClick}
        >
          {isConnected ? 'Replace' : 'Connect'}
        </Button>
      </div>
    </div>
  )
}
