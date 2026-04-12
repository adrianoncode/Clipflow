import Link from 'next/link'

import { TrendRadarClient } from '@/components/workspace/trend-radar-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Trend Radar' }

interface PageProps {
  params: { id: string }
}

export default function TrendsPage({ params }: PageProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/workspace/${params.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to workspace
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trend Radar</h1>
        <p className="mt-1 text-muted-foreground">
          What&apos;s trending right now — matched to your content
        </p>
      </div>
      <TrendRadarClient workspaceId={params.id} />
    </div>
  )
}
