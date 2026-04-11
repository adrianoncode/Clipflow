import Link from 'next/link'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AiKeyForm } from '@/components/ai-keys/ai-key-form'
import { OnboardingStepper } from '@/components/onboarding/stepper'
import { saveAiKeyOnboardingAction } from '@/app/(onboarding)/onboarding/ai-key/actions'

export const metadata = {
  title: 'Add your first AI key',
}

export default function OnboardingAiKeyPage() {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <OnboardingStepper activeStep={3} />
        <div className="space-y-1">
          <CardTitle className="text-2xl">Bring your own AI key</CardTitle>
          <CardDescription>
            Clipflow uses your key to generate drafts. We validate it once, encrypt it at
            rest, and never ship it to the browser.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <AiKeyForm action={saveAiKeyOnboardingAction} submitLabel="Save and continue" />
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/onboarding/complete"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Skip for now — I&apos;ll add a key later
        </Link>
      </CardFooter>
    </Card>
  )
}
