'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { CheckSquare2, ExternalLink, Send, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { publishOutputAction, type PublishOutputState } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/publish-actions'
import type { PublishablePlatform } from '@/lib/publish/route'

// Local alias so the component reads cleanly. All the canonical
// platform types live in lib/publish/route.ts now.
type PublishPlatform = PublishablePlatform

interface PublishPanelProps {
  workspaceId: string
  outputId: string
  /** Platform of this specific output — pre-selected by default. */
  defaultPlatform: string
  /** Pre-filled caption from the output body / metadata caption. */
  defaultCaption: string
  /** Upload-Post key is connected in this workspace. */
  hasPublishKey: boolean
}

type PlatformMeta = { id: PublishPlatform; label: string; icon: string }

const PLATFORMS: PlatformMeta[] = [
  { id: 'tiktok',    label: 'TikTok',    icon: '🎵' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube',   label: 'YouTube',   icon: '▶️' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: '💼' },
  { id: 'x',         label: 'X',         icon: '𝕏' },
  { id: 'facebook',  label: 'Facebook',  icon: 'f' },
]

/** Maps Clipflow output platform slugs to Upload-Post platform IDs. */
function defaultPlatformsFor(outputPlatform: string): PublishPlatform[] {
  const map: Record<string, PublishPlatform> = {
    tiktok:           'tiktok',
    instagram_reels:  'instagram',
    youtube_shorts:   'youtube',
    linkedin:         'linkedin',
    x:                'x',
    twitter:          'x',
    facebook:         'facebook',
  }
  const mapped = map[outputPlatform]
  return mapped ? [mapped] : ['tiktok']
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
      <Send className="h-3.5 w-3.5" />
      {pending ? 'Publishing…' : 'Publish now'}
    </Button>
  )
}

export function PublishPanel({
  workspaceId,
  outputId: _outputId,
  defaultPlatform,
  defaultCaption,
  hasPublishKey,
}: PublishPanelProps) {
  const [selected, setSelected] = useState<Set<PublishPlatform>>(
    new Set(defaultPlatformsFor(defaultPlatform)),
  )
  const [caption, setCaption] = useState(defaultCaption)
  const [videoUrl, setVideoUrl] = useState('')

  const action = useCallback(
    async (prev: PublishOutputState, formData: FormData): Promise<PublishOutputState> => {
      formData.set('workspace_id', workspaceId)
      formData.set('platforms', JSON.stringify([...selected]))
      formData.set('caption', caption)
      formData.set('video_url', videoUrl)
      return publishOutputAction(prev, formData)
    },
    [workspaceId, selected, caption, videoUrl],
  )

  const [state, formAction] = useFormState(action, {} as PublishOutputState)

  function togglePlatform(id: PublishPlatform) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Not connected ───────────────────────────────────────────────
  if (!hasPublishKey) {
    return (
      <div className="mt-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold">Upload-Post not connected</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Connect Upload-Post to publish directly to TikTok,
          Instagram, YouTube, and LinkedIn from here. You bring your own
          account — free tier covers 10 posts/mo.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/settings/ai-keys"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Connect in Settings
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Link>
          <a
            href="https://upload-post.com/register"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            Sign up at upload-post.com
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    )
  }

  // ── Published success ───────────────────────────────────────────
  if (state?.ok === true) {
    return (
      <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-primary">Published</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Posted to{' '}
          {state.postedTo
            .map((p) => PLATFORMS.find((x) => x.id === p)?.label ?? p)
            .join(', ')}
          . It may take a minute to appear on each platform.
        </p>
      </div>
    )
  }

  // ── Publish form ────────────────────────────────────────────────
  return (
    <form
      action={formAction}
      className="mt-2 space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4"
    >
      {/* Step 1 — platforms */}
      <div className="space-y-1.5">
        <p className="font-bold text-[10px] uppercase tracking-[0.15em] text-primary/85">
          1 · Choose platforms
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const on = selected.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlatform(p.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  on
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {on ? (
                  <CheckSquare2 className="h-3 w-3 shrink-0" />
                ) : (
                  <Square className="h-3 w-3 shrink-0" />
                )}
                {p.icon} {p.label}
              </button>
            )
          })}
        </div>
        {selected.size === 0 && (
          <p className="text-[11px] text-destructive">Select at least one platform.</p>
        )}
      </div>

      {/* Step 2 — video URL */}
      <div className="space-y-1.5">
        <p className="font-bold text-[10px] uppercase tracking-[0.15em] text-primary/85">
          2 · Video URL
        </p>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://… (paste your rendered MP4 URL)"
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground">
          Render a video in the{' '}
          <Link href="#video-studio" className="underline underline-offset-4">
            Video Studio
          </Link>{' '}
          tab, then paste the MP4 link here. Or use any public video URL.
        </p>
      </div>

      {/* Step 3 — caption */}
      <div className="space-y-1.5">
        <p className="font-bold text-[10px] uppercase tracking-[0.15em] text-primary/85">
          3 · Caption
        </p>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Your caption…"
        />
        <p className="text-[11px] text-muted-foreground">
          Pre-filled from this output. Edit before posting.
        </p>
      </div>

      {/* Error */}
      {state?.ok === false && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Posts via your Upload-Post account. You pay them directly.
        </p>
        <SubmitButton />
      </div>
    </form>
  )
}
