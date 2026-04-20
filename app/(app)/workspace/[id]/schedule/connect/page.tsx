import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getSocialAccounts } from '@/lib/scheduler/get-social-accounts'
import { ConnectPlatformCard } from '@/components/scheduler/connect-platform-card'
import { PageHeading } from '@/components/workspace/page-heading'

export const metadata = { title: 'Connect Social Accounts' }

interface ConnectPageProps {
  params: { id: string }
}

const PLATFORMS = [
  {
    id: 'tiktok',
    label: 'TikTok',
    emoji: '🎵',
    devPortalUrl: 'https://developers.tiktok.com',
    instructions:
      'Create a TikTok Developer App at developers.tiktok.com, enable the Content Posting API, complete OAuth to obtain a user access token, then paste it below.',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    emoji: '📸',
    devPortalUrl: 'https://developers.facebook.com',
    instructions:
      'Create a Meta / Facebook App at developers.facebook.com, add the Instagram Graph API product, complete the OAuth flow to obtain a Page / User access token, then paste it below.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    emoji: '💼',
    devPortalUrl: 'https://www.linkedin.com/developers/',
    instructions:
      'Create a LinkedIn App at linkedin.com/developers, request the "Share on LinkedIn" and "Sign In with LinkedIn" products, complete OAuth to obtain an access token, then paste it below.',
  },
]

export default async function ConnectPage({ params }: ConnectPageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  const accounts = await getSocialAccounts(params.id)
  const connectedMap = new Map(accounts.map((a) => [a.platform, a]))

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <Link
          href={`/workspace/${params.id}/schedule`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Scheduler
        </Link>
      </div>

      <PageHeading
        eyebrow="Scheduler · Connect"
        title="Connect social accounts."
        body="OAuth integration requires a developer app for each platform. Paste your access token below to get started — full OAuth flows will be added when developer apps are approved."
      />

      <div className="space-y-4">
        {PLATFORMS.map((platform) => (
          <ConnectPlatformCard
            key={platform.id}
            platform={platform.id}
            label={platform.label}
            emoji={platform.emoji}
            devPortalUrl={platform.devPortalUrl}
            instructions={platform.instructions}
            workspaceId={params.id}
            connectedAccount={connectedMap.get(platform.id) ?? null}
          />
        ))}
      </div>
    </div>
  )
}
