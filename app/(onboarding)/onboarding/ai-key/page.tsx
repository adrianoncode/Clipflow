import Link from 'next/link'
import { Shield, Zap, Key } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AiKeyForm } from '@/components/ai-keys/ai-key-form'
import { OnboardingStepper } from '@/components/onboarding/stepper'
import { saveAiKeyOnboardingAction } from '@/app/(onboarding)/onboarding/ai-key/actions'

export const metadata = { title: 'Connect your AI' }

export default function OnboardingAiKeyPage() {
  return (
    <Card className="w-full max-w-lg border-border/50 shadow-2xl">
      <CardHeader className="space-y-6 pb-2 text-center">
        <OnboardingStepper activeStep={3} />
        <div className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10">
            <Key className="h-6 w-6 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Connect your AI key</h1>
          <p className="text-sm text-muted-foreground">
            Clipflow uses your own API key — you pay your provider directly at cost. Zero markup, ever.
          </p>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">AES-256 encrypted</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Validated before save</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AiKeyForm action={saveAiKeyOnboardingAction} submitLabel="Save and continue" />

        <div className="text-center">
          <Link
            href="/onboarding/complete"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Skip for now — I&apos;ll add a key later
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
