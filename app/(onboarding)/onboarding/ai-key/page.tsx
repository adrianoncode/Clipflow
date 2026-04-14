import Link from 'next/link'
import { Shield, Zap } from 'lucide-react'

import { AiKeyForm } from '@/components/ai-keys/ai-key-form'
import { OnboardingStepper } from '@/components/onboarding/stepper'
import { saveAiKeyOnboardingAction } from '@/app/(onboarding)/onboarding/ai-key/actions'

export const metadata = { title: 'Connect your AI' }

export default function OnboardingAiKeyPage() {
  return (
    <div className="space-y-10">
      <OnboardingStepper activeStep={3} />
      <div className="space-y-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Step 03 — your AI provider
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Connect your AI key
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Clipflow runs on your own API key — you pay your provider directly at
          cost. Zero markup, ever.
        </p>
      </div>

      {/* Trust signals — monochrome, aligned to the data-sheet style */}
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
              we test-call the provider
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AiKeyForm
          action={saveAiKeyOnboardingAction}
          submitLabel="Save and continue →"
        />
        <div className="text-center">
          <Link
            href="/onboarding/complete"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Skip for now — I&apos;ll add a key later
          </Link>
        </div>
      </div>
    </div>
  )
}
