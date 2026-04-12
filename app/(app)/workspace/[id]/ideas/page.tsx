import Link from 'next/link'

import { GapAnalysisPanel } from '@/components/ideas/gap-analysis-panel'
import { IdeasPanel } from '@/components/ideas/ideas-panel'

interface IdeasPageProps {
  params: { id: string }
}

export default function IdeasPage({ params }: IdeasPageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href={`/workspace/${params.id}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to workspace
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Ideas Generator</h1>
        <p className="text-sm text-muted-foreground">
          Describe your niche and audience — get 15 platform-specific content ideas instantly.
        </p>
      </div>

      <IdeasPanel workspaceId={params.id} />

      <hr className="border-border" />

      <GapAnalysisPanel workspaceId={params.id} />
    </div>
  )
}
