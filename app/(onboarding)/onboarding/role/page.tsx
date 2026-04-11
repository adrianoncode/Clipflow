import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { OnboardingStepper } from '@/components/onboarding/stepper'
import { RoleStep } from '@/components/onboarding/role-step'

export const metadata = {
  title: 'Welcome',
}

export default function OnboardingRolePage() {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <OnboardingStepper activeStep={1} />
        <div className="space-y-1">
          <CardTitle className="text-2xl">How will you use Clipflow?</CardTitle>
          <CardDescription>Pick what fits best. You can change this later.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <RoleStep />
      </CardContent>
    </Card>
  )
}
