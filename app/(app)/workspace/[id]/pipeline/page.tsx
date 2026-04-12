import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pipeline' }

type PipelineState = 'draft' | 'review' | 'approved' | 'exported'

interface PipelineOutput {
  id: string
  platform: string
  created_at: string
  contentTitle: string | null
  state: PipelineState
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Reels',
  youtube_shorts: 'Shorts',
  linkedin: 'LinkedIn',
}

const PLATFORM_BADGE_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
  instagram_reels: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  youtube_shorts: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
}

const COLUMN_CONFIG: {
  state: PipelineState
  label: string
  headerClass: string
  dotClass: string
}[] = [
  {
    state: 'draft',
    label: 'Draft',
    headerClass: 'border-zinc-300 dark:border-zinc-600',
    dotClass: 'bg-zinc-400',
  },
  {
    state: 'review',
    label: 'Review',
    headerClass: 'border-amber-400',
    dotClass: 'bg-amber-400',
  },
  {
    state: 'approved',
    label: 'Approved',
    headerClass: 'border-green-500',
    dotClass: 'bg-green-500',
  },
  {
    state: 'exported',
    label: 'Exported',
    headerClass: 'border-blue-500',
    dotClass: 'bg-blue-500',
  },
]

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.round(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

interface PipelinePageProps {
  params: { id: string }
}

export default async function PipelinePage({ params }: PipelinePageProps) {
  const { id: workspaceId } = params

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Verify workspace membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) notFound()

  // Fetch outputs with content title
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, platform, created_at, content_id, content_items(title)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(100)

  const outputIds = (outputs ?? []).map((o) => o.id)

  // Fetch all output_states for these outputs
  const { data: states } = outputIds.length > 0
    ? await supabase
        .from('output_states')
        .select('output_id, state, created_at')
        .in('output_id', outputIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Find latest state per output_id
  const latestStateByOutput = new Map<string, string>()
  for (const row of states ?? []) {
    if (!latestStateByOutput.has(row.output_id)) {
      latestStateByOutput.set(row.output_id, row.state)
    }
  }

  // Build enriched output list
  const enriched: PipelineOutput[] = (outputs ?? []).map((o) => {
    const contentItem = (o.content_items as unknown) as { title: string | null } | null
    const rawState = latestStateByOutput.get(o.id) ?? 'draft'
    const state: PipelineState =
      rawState === 'review' || rawState === 'approved' || rawState === 'exported'
        ? (rawState as PipelineState)
        : 'draft'
    return {
      id: o.id,
      platform: o.platform,
      created_at: o.created_at,
      contentTitle: contentItem?.title ?? null,
      state,
    }
  })

  // Group by state
  const grouped: Record<PipelineState, PipelineOutput[]> = {
    draft: [],
    review: [],
    approved: [],
    exported: [],
  }
  for (const output of enriched) {
    grouped[output.state].push(output)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Content Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          All outputs grouped by their current state.
        </p>
      </div>

      {/* Kanban board */}
      {enriched.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No outputs yet.</p>
          <Link
            href={`/workspace/${workspaceId}`}
            className="mt-3 inline-block text-xs text-primary underline-offset-4 hover:underline"
          >
            Go to workspace to create content →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMN_CONFIG.map((col) => {
            const items = grouped[col.state]
            return (
              <div key={col.state} className="flex flex-col gap-3">
                {/* Column header */}
                <div className={`flex items-center gap-2 border-b-2 pb-2 ${col.headerClass}`}>
                  <span className={`h-2 w-2 rounded-full ${col.dotClass}`} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-xs text-muted-foreground">None</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {items.map((output) => (
                      <div
                        key={output.id}
                        className="rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow"
                      >
                        <p className="truncate text-sm font-medium">
                          {output.contentTitle ?? 'Untitled'}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_BADGE_COLORS[output.platform] ?? 'bg-muted text-muted-foreground'}`}
                          >
                            {PLATFORM_LABELS[output.platform] ?? output.platform}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelative(output.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
