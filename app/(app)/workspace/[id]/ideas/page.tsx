import { Lightbulb } from 'lucide-react'

import { PageHeading } from '@/components/workspace/page-heading'
import { IdeaGeneratorClient } from './idea-generator-client'

export const metadata = { title: 'Idea generator' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

/**
 * Idea Generator — give a topic, get 8-10 content ideas tuned to the
 * workspace's brand voice. Each idea is a self-contained brief (title,
 * hook, outline, suggested platforms, length) so the user can pick one
 * and go record.
 *
 * No persistence yet — results are per-session. If user feedback says
 * ideas deserve a backlog, we'll add an `ideas` table with a "convert
 * to content" action that seeds a /content/new with the selected idea.
 */
export default function IdeasPage({ params }: PageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-8">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#EDE6F5' }}
        >
          <Lightbulb className="h-5 w-5" style={{ color: '#2A1A3D' }} />
        </div>
        <PageHeading
          eyebrow="Research · Ideas"
          title="Idea generator."
          body="Give Clipflow a topic. You'll get 8-10 on-brand content ideas, each with a hook, an outline, and recommended platforms — ready to turn into a recording."
        />
      </div>

      <IdeaGeneratorClient workspaceId={params.id} />
    </div>
  )
}
