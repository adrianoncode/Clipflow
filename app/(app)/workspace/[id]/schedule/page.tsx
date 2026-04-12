import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getScheduledOutputs } from '@/lib/schedule/get-scheduled-outputs'

export const dynamic = 'force-dynamic'

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Instagram Reels',
  youtube_shorts: 'YouTube Shorts',
  linkedin: 'LinkedIn',
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
  instagram_reels: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  youtube_shorts: 'bg-red-500/10 text-red-700 border-red-500/20',
  linkedin: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
}

interface SchedulePageProps {
  params: { id: string }
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  const outputs = await getScheduledOutputs(params.id)

  // Group by date string (YYYY-MM-DD local)
  const groups = new Map<string, typeof outputs>()
  for (const o of outputs) {
    const date = new Date(o.scheduled_for).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date)!.push(o)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Publishing Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Outputs with a scheduled date. Set dates from the Outputs page.
        </p>
      </div>

      {outputs.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-8 text-center space-y-2">
          <p className="text-sm font-medium">No scheduled posts yet</p>
          <p className="text-xs text-muted-foreground">
            Go to an output, click{' '}
            <span className="font-mono bg-muted px-1 rounded">Schedule</span>, pick a date and
            it will appear here.
          </p>
          <Link
            href={`/workspace/${params.id}`}
            className="mt-2 inline-block text-xs underline underline-offset-4"
          >
            Go to content
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([date, items]) => (
            <div key={date}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{date}</h2>
              <ul className="divide-y rounded-md border">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start gap-4 px-4 py-3">
                    <span
                      className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${PLATFORM_COLORS[item.platform] ?? 'bg-muted text-muted-foreground border-border'}`}
                    >
                      {PLATFORM_LABELS[item.platform] ?? item.platform}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/workspace/${params.id}/content/${item.content_id}/outputs`}
                        className="truncate text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {item.content_title ?? 'Untitled'}
                      </Link>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {item.body?.slice(0, 120) ?? ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(item.scheduled_for).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
