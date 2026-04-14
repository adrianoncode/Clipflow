'use client'

import Image from 'next/image'
import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { Search, Youtube, Users } from 'lucide-react'
import { searchCreatorsAction } from '@/app/(app)/workspace/[id]/creators/actions'

interface CreatorSearchClientProps {
  workspaceId: string
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      <Search className="h-4 w-4" />
      {pending ? 'Searching...' : 'Search'}
    </button>
  )
}

export function CreatorSearchClient({ workspaceId: _workspaceId }: CreatorSearchClientProps) {
  const [state, formAction] = useFormState(searchCreatorsAction, {})
  const [platform, setPlatform] = useState('youtube')

  const results = state.ok === true ? (state.results as {
    platform: string
    creators: Array<Record<string, unknown>>
  }) : null

  return (
    <div className="space-y-6">
      {/* Search form */}
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="platform" value={platform} />

        {/* Platform tabs */}
        <div className="flex gap-1.5">
          {[
            { id: 'youtube', label: 'YouTube', color: 'text-red-400' },
            { id: 'tiktok', label: 'TikTok', color: 'text-pink-400' },
            { id: 'instagram', label: 'Instagram', color: 'text-purple-400' },
            { id: 'twitter', label: 'Twitter/X', color: 'text-neutral-300' },
            { id: 'linkedin', label: 'LinkedIn', color: 'text-blue-400' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                platform === p.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-muted text-muted-foreground border border-transparent hover:bg-accent'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex gap-2">
          <input
            name="query"
            type="text"
            required
            placeholder={
              platform === 'youtube'
                ? 'Search by niche, e.g. "fitness", "SaaS marketing"'
                : platform === 'linkedin'
                  ? 'Enter LinkedIn profile URL'
                  : `Enter @username, e.g. @${platform === 'tiktok' ? 'charlidamelio' : platform === 'twitter' ? 'elonmusk' : 'cristiano'}`
            }
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <SubmitButton />
        </div>

        <p className="text-xs text-muted-foreground">
          {platform === 'youtube'
            ? 'Searches YouTube channels via official API. Free and unlimited.'
            : `Fetches public ${platform === 'tiktok' ? 'TikTok' : 'Instagram'} profile data.`}
        </p>
      </form>

      {/* Error */}
      {state.ok === false && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(state as { error: string }).error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {results.creators.length} creators found
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.creators.map((creator, i) => (
              <CreatorCard key={i} creator={creator} platform={results.platform} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CreatorCard({ creator, platform }: { creator: Record<string, unknown>; platform: string }) {
  const name = (creator.name ?? creator.displayName ?? creator.username ?? 'Unknown') as string
  const thumbnail = (creator.thumbnail ?? creator.avatar ?? null) as string | null
  const subscribers = (creator.subscriberCount ?? creator.followers ?? 0) as number
  const videos = (creator.videoCount ?? creator.posts ?? 0) as number
  const views = (creator.viewCount ?? creator.likes ?? 0) as number
  const bio = (creator.description ?? creator.bio ?? '') as string
  const channelId = creator.channelId as string | undefined

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border hover:bg-accent/30">
      {/* Header */}
      <div className="flex items-center gap-3">
        {thumbnail ? (
          // Creator thumbnails come from ScrapeCreators (varied hosts) — keep
          // unoptimized so we don't have to maintain a remotePatterns list.
          <Image
            src={thumbnail}
            alt={name}
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          {bio && <p className="truncate text-xs text-muted-foreground">{bio}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-2">
        <div className="text-center">
          <p className="text-sm font-bold tabular-nums">{formatCount(subscribers)}</p>
          <p className="text-[10px] text-muted-foreground">{platform === 'youtube' ? 'Subs' : 'Followers'}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold tabular-nums">{formatCount(videos)}</p>
          <p className="text-[10px] text-muted-foreground">{platform === 'youtube' ? 'Videos' : 'Posts'}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold tabular-nums">{formatCount(views)}</p>
          <p className="text-[10px] text-muted-foreground">{platform === 'youtube' ? 'Views' : 'Likes'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        {platform === 'youtube' && channelId && (
          <a
            href={`https://youtube.com/channel/${channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Youtube className="h-3 w-3" />
            View Channel
          </a>
        )}
        {platform === 'tiktok' && (
          <a
            href={`https://tiktok.com/@${creator.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            View Profile
          </a>
        )}
        {platform === 'instagram' && (
          <a
            href={`https://instagram.com/${creator.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            View Profile
          </a>
        )}
      </div>
    </div>
  )
}
