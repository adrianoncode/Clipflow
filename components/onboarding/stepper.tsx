import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

const STEPS = [
  { n: 1, label: 'Role' },
  { n: 2, label: 'Workspace' },
  { n: 3, label: 'Connect AI' },
  { n: 4, label: 'Launch' },
] as const

export type StepNumber = 1 | 2 | 3 | 4

interface OnboardingStepperProps {
  activeStep: StepNumber
}

/**
 * Minimal progress indicator. Each step is a mono-font number + label
 * connected by a thin progress bar that fills proportionally to the
 * active step. Replaces the rainbow circle+check pattern — feels like
 * a setup wizard for a real tool, not a game.
 */
export function OnboardingStepper({ activeStep }: OnboardingStepperProps) {
  const totalSteps = STEPS.length
  const progressPct = ((activeStep - 1) / (totalSteps - 1)) * 100

  return (
    <nav aria-label="Onboarding progress" className="relative">
      {/* Step pips + labels */}
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <span
          aria-hidden
          className="absolute left-3 right-3 top-3 h-px bg-border"
        />
        {/* Active track */}
        <span
          aria-hidden
          className="absolute left-3 top-3 h-px bg-primary transition-all duration-500"
          style={{
            width: `calc((100% - 24px) * ${progressPct / 100})`,
          }}
        />

        {STEPS.map((step) => {
          const isActive = step.n === activeStep
          const isDone = step.n < activeStep
          return (
            <div
              key={step.n}
              className="relative flex flex-col items-center gap-2"
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-mono font-semibold transition-all duration-300',
                  isActive &&
                    'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-4 ring-primary/15',
                  isDone && 'border-primary bg-primary text-primary-foreground',
                  !isActive &&
                    !isDone &&
                    'border-border bg-background text-muted-foreground',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  step.n
                )}
              </div>
              <span
                className={cn(
                  'font-bold text-[10px] uppercase tracking-[0.15em] transition-colors',
                  isActive || isDone
                    ? 'text-foreground'
                    : 'text-muted-foreground/70',
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
