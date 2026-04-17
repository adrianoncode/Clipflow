import { notFound } from 'next/navigation'

import { OnboardingWizard } from '@/components/workspace/onboarding-wizard'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

interface OnboardingPageProps {
  params: { id: string }
}

export const metadata = { title: 'Set up client workspace' }

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
      <OnboardingWizard workspaceId={params.id} workspaceName={workspace.name} />
    </div>
  )
}
