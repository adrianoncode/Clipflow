import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { OnboardingStepper } from '@/components/onboarding/stepper'
import { WorkspaceSoloForm } from '@/components/onboarding/workspace-solo-form'
import { WorkspaceTeamForm } from '@/components/onboarding/workspace-team-form'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { ONBOARDING_ROLE_COOKIE } from '@/app/(onboarding)/onboarding/cookies'

export const metadata = {
  title: 'Workspace setup',
}

type OnboardingRole = 'solo' | 'team' | 'agency'

function parseRoleCookie(value: string | undefined): OnboardingRole | null {
  if (value === 'solo' || value === 'team' || value === 'agency') return value
  return null
}

export default async function OnboardingWorkspacePage() {
  const role = parseRoleCookie(cookies().get(ONBOARDING_ROLE_COOKIE)?.value)
  if (!role) {
    redirect('/onboarding/role')
  }

  const workspaces = await getWorkspaces()
  const personal = workspaces.find((w) => w.type === 'personal')

  if (role === 'solo') {
    if (!personal) {
      // The signup trigger guarantees a personal workspace exists — if we
      // don't see it, something's off. Send the user back to Step 1 rather
      // than rendering a broken form.
      redirect('/onboarding/role')
    }

    return (
      <Card>
        <CardHeader className="space-y-4">
          <OnboardingStepper activeStep={2} />
          <div className="space-y-1">
            <CardTitle className="text-2xl">Name your workspace</CardTitle>
            <CardDescription>
              This is where your content lives. You can rename it any time.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <WorkspaceSoloForm
            personalWorkspaceId={personal.id}
            currentName={personal.name}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <OnboardingStepper activeStep={2} />
        <div className="space-y-1">
          <CardTitle className="text-2xl">
            {role === 'agency' ? 'Name your agency' : 'Name your team'}
          </CardTitle>
          <CardDescription>
            {role === 'agency'
              ? 'Set up your main agency workspace. Client-specific workspaces come next.'
              : 'Create a shared workspace for your team. You can invite teammates later.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <WorkspaceTeamForm roleType={role} />
      </CardContent>
    </Card>
  )
}
