import Link from 'next/link'

import { ChannelScanner } from '@/components/channels/channel-scanner'

interface ChannelsPageProps {
  params: { id: string }
}

export default function ChannelsPage({ params }: ChannelsPageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href={`/workspace/${params.id}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to workspace
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Channel Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Paste a YouTube channel URL to see the latest videos and import them with one click.
        </p>
      </div>

      <ChannelScanner workspaceId={params.id} />
    </div>
  )
}
