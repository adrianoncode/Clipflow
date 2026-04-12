import Link from 'next/link'

import { CompetitorSpyClient } from '@/components/workspace/competitor-spy-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Competitor Spy' }

interface PageProps {
  params: { id: string }
}

export default function CompetitorsPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold tracking-tight">Competitor Spy</h1>
        <p className="mt-1 text-muted-foreground">
          Analyze any competitor&apos;s content strategy — tone, topics, gaps, and how to stand out
        </p>
      </div>
      <CompetitorSpyClient workspaceId={params.id} />
    </div>
  )
}
