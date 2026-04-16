import Link from 'next/link'
import { ArrowRight, PenLine, Upload } from 'lucide-react'

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
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ideas Generator</h1>
            <p className="text-sm text-muted-foreground">
              Describe your niche and audience — get 15 platform-specific content ideas instantly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${params.id}/ghostwriter`}
              className="group inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary hover:shadow-sm"
            >
              <PenLine className="h-3.5 w-3.5" />
              Write script
            </Link>
            <Link
              href={`/workspace/${params.id}/content/new`}
              className="group inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <Upload className="h-3.5 w-3.5" />
              Create content
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      <IdeasPanel workspaceId={params.id} />

      <hr className="border-border" />

      <GapAnalysisPanel workspaceId={params.id} />
    </div>
  )
}
