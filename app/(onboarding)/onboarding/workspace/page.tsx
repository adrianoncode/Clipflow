import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Folder } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { OnboardingStepper } from '@/components/onboarding/stepper'
import { WorkspaceSoloForm } from '@/components/onboarding/workspace-solo-form'
import { WorkspaceTeamForm } from '@/components/onboarding/workspace-team-form'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { ONBOARDING_ROLE_COOKIE } from '@/app/(onboarding)/onboarding/cookies'

export const metadata = { title: 'Workspace setup' }

type OnboardingRole = 'solo' | 'team' | 'agency'

function parseRoleCookie(value: string | undefined): OnboardingRole | null {
  if (value === 'solo' || value === 'team' || value === 'agency') return value
  return null
}

export default async function OnboardingWorkspacePage() {
  const role = parseRoleCookie(cookies().get(ONBOARDING_ROLE_COOKIE)?.value)
  if (!role) redirect('/onboarding/role')

  const workspaces = await getWorkspaces()
  const personal = workspaces.find((w) => w.type === 'personal')

  const title = role === 'solo'
    ? 'Name your workspace'
    : role === 'agency'
      ? 'Name your agency'
      : 'Name your team'

  const subtitle = role === 'solo'
    ? 'This is your creative home base. All your content lives here.'
    : role === 'agency'
      ? 'Your agency workspace. Add client workspaces later.'
      : 'A shared workspace for your team. Invite members later.'

  if (role === 'solo' && !personal) redirect('/onboarding/role')

  return (
    <Card className="w-full max-w-lg border-border/50 shadow-2xl">
      <CardHeader className="space-y-6 pb-2 text-center">
        <OnboardingStepper activeStep={2} />
        <div className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
            <Folder className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </CardHeader>
      <CardContent>
        {role === 'solo' && personal ? (
          <WorkspaceSoloForm personalWorkspaceId={personal.id} currentName={personal.name} />
        ) : (
          <WorkspaceTeamForm roleType={role as 'team' | 'agency'} />
        )}
      </CardContent>
    </Card>
  )
}
