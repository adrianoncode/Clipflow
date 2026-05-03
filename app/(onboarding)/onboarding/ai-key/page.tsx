import Link from 'next/link'
import { ArrowRight, Shield, Zap } from 'lucide-react'

import { OnboardingServicePicker } from '@/components/onboarding/service-picker'
import { OnboardingStepper } from '@/components/onboarding/stepper'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = { title: 'Connect your APIs' }

export default async function OnboardingApiKeysPage() {
  const workspaces = await getWorkspaces()
  const currentWorkspace =
    workspaces.find((w) => w.type === 'personal') ?? workspaces[0]

  const existingKeys = currentWorkspace
    ? await getAiKeys(currentWorkspace.id)
    : []
  const connectedProviders = new Set(existingKeys.map((k) => k.provider))

  return (
    <div className="space-y-10">
      <OnboardingStepper activeStep={3} />
      <div className="space-y-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Step 03 — bring your APIs
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Connect your APIs
        </h1>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          Clipflow never marks up API costs. Bring your own keys — you pay
          providers directly, at cost. Pick at least one AI provider to get
          started; the media stack is optional and unlocks rendering when you
          connect it.
        </p>
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-2">
        <div className="flex items-center gap-2.5 bg-card px-4 py-3">
          <Shield className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              AES-256 encrypted
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              at rest, per row
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-card px-4 py-3">
          <Zap className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              Validated before save
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              we test every key
            </p>
          </div>
        </div>
      </div>

      {currentWorkspace ? (
        <OnboardingServicePicker
          workspaceId={currentWorkspace.id}
          connectedProviders={Array.from(connectedProviders)}
        />
      ) : null}

      {/* Skip option — visible but secondary */}
      <div className="flex flex-col items-center gap-1.5 pt-2 text-center">
        <Link
          href="/onboarding/complete"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
        >
          I&apos;ll do this later
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <p className="text-[11px] text-muted-foreground/70">
          You can connect your AI provider anytime in Settings &rarr; AI Keys
        </p>
      </div>
    </div>
  )
}
