import { cn } from '@/lib/utils'

const STEPS = [
  { n: 1, label: 'Role' },
  { n: 2, label: 'Workspace' },
  { n: 3, label: 'AI Key' },
  { n: 4, label: 'Done' },
] as const

export type StepNumber = 1 | 2 | 3 | 4

interface OnboardingStepperProps {
  activeStep: StepNumber
}

/**
 * Purely presentational 4-dot progress indicator. Each page passes its own
 * `activeStep` — the layout doesn't know the current path, so this keeps
 * things dumb and composable.
 */
export function OnboardingStepper({ activeStep }: OnboardingStepperProps) {
  return (
    <nav
      className="flex items-center justify-center gap-2"
      aria-label="Onboarding progress"
    >
      {STEPS.map((step, idx) => {
        const isActive = step.n === activeStep
        const isDone = step.n < activeStep
        return (
          <div key={step.n} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                isActive && 'border-primary bg-primary text-primary-foreground',
                isDone && 'border-primary/60 bg-primary/15 text-primary',
                !isActive &&
                  !isDone &&
                  'border-border bg-background text-muted-foreground',
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              {step.n}
            </div>
            {idx < STEPS.length - 1 ? (
              <div
                className={cn(
                  'h-px w-6',
                  step.n < activeStep ? 'bg-primary/60' : 'bg-border',
                )}
              />
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
