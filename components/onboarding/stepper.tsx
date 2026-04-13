import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { n: 1, label: 'You' },
  { n: 2, label: 'Workspace' },
  { n: 3, label: 'AI Key' },
  { n: 4, label: 'Magic' },
] as const

export type StepNumber = 1 | 2 | 3 | 4

interface OnboardingStepperProps {
  activeStep: StepNumber
}

export function OnboardingStepper({ activeStep }: OnboardingStepperProps) {
  return (
    <nav className="flex items-center justify-center gap-0" aria-label="Onboarding progress">
      {STEPS.map((step, idx) => {
        const isActive = step.n === activeStep
        const isDone = step.n < activeStep

        return (
          <div key={step.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                  isActive && 'bg-violet-500 text-white shadow-lg shadow-violet-500/30 ring-4 ring-violet-500/20',
                  isDone && 'bg-emerald-500 text-white',
                  !isActive && !isDone && 'bg-muted text-muted-foreground',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <Check className="h-4 w-4" /> : step.n}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-3 mt-[-18px] h-[2px] w-12 rounded-full transition-colors duration-300',
                  step.n < activeStep ? 'bg-emerald-500' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
