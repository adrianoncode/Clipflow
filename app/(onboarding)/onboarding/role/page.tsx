import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { OnboardingStepper } from '@/components/onboarding/stepper'
import { RoleStep } from '@/components/onboarding/role-step'

export const metadata = { title: 'Welcome to Clipflow' }

export default function OnboardingRolePage() {
  return (
    <Card className="w-full max-w-lg border-border/50 shadow-2xl">
      <CardHeader className="space-y-6 pb-2 text-center">
        <OnboardingStepper activeStep={1} />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Clipflow
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            How will you use Clipflow? This helps us set up your workspace.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <RoleStep />
      </CardContent>
    </Card>
  )
}
