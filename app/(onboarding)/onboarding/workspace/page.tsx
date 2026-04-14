import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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

  const title =
    role === 'solo'
      ? 'Name your workspace'
      : role === 'agency'
        ? 'Name your agency'
        : 'Name your team'

  const subtitle =
    role === 'solo'
      ? 'This is your creative home base. All your content lives here.'
      : role === 'agency'
        ? 'Your agency workspace. Add client workspaces later.'
        : 'A shared workspace for your team. Invite members later.'

  if (role === 'solo' && !personal) redirect('/onboarding/role')

  return (
    <div className="space-y-10">
      <OnboardingStepper activeStep={2} />
      <div className="space-y-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Step 02 — your home base
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {role === 'solo' && personal ? (
        <WorkspaceSoloForm
          personalWorkspaceId={personal.id}
          currentName={personal.name}
        />
      ) : (
        <WorkspaceTeamForm roleType={role as 'team' | 'agency'} />
      )}
    </div>
  )
}
