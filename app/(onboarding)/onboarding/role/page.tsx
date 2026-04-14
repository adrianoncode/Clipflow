import { OnboardingStepper } from '@/components/onboarding/stepper'
import { RoleStep } from '@/components/onboarding/role-step'

export const metadata = { title: 'Welcome to Clipflow' }

export default function OnboardingRolePage() {
  return (
    <div className="space-y-10">
      <OnboardingStepper activeStep={1} />
      <div className="space-y-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Step 01 — who you are
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          How will you use Clipflow?
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          This tunes your workspace, pipeline, and member defaults. You can
          always change it later in settings.
        </p>
      </div>
      <RoleStep />
    </div>
  )
}
