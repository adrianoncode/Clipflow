import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { createClient } from '@/lib/supabase/server'
import { BatchGenerator } from '@/components/workspace/batch-generator'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Batch Generate' }

interface BatchPageProps {
  params: { id: string }
}

export default async function BatchPage({ params }: BatchPageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  const supabase = createClient()

  // Fetch ready content items
  const { data: items } = await supabase
    .from('content_items')
    .select('id, title, kind, created_at')
    .eq('workspace_id', params.id)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(50)

  const contentItems = items ?? []

  // Check which items have outputs
  let hasOutputsSet = new Set<string>()
  if (contentItems.length > 0) {
    const { data: outputRows } = await supabase
      .from('outputs')
      .select('content_id')
      .eq('workspace_id', params.id)
      .in('content_id', contentItems.map((i) => i.id))

    hasOutputsSet = new Set((outputRows ?? []).map((o) => o.content_id))
  }

  const enrichedItems = contentItems.map((item) => ({
    id: item.id,
    title: item.title,
    kind: item.kind,
    created_at: item.created_at,
    hasOutputs: hasOutputsSet.has(item.id),
  }))

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href={`/workspace/${params.id}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to workspace
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Batch Generate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select up to 10 content items to generate platform outputs for all of them at once.
        </p>
      </div>
      <BatchGenerator items={enrichedItems} workspaceId={params.id} />
    </div>
  )
}
