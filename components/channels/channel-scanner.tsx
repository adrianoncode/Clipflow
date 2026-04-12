'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  scanChannelAction,
  importVideoAction,
  type ScanChannelState,
  type ImportVideoState,
} from '@/app/(app)/workspace/[id]/channels/actions'

function ScanButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Scanning…' : 'Scan channel'}
    </Button>
  )
}

function ImportButton({ videoUrl, videoTitle, workspaceId }: {
  videoUrl: string
  videoTitle: string
  workspaceId: string
}) {
  const [state, action] = useFormState(importVideoAction, {} as ImportVideoState)
  const { pending } = useFormStatus()

  if (state.ok === true) {
    return (
      <Link
        href={`/workspace/${workspaceId}/content/${state.contentId}`}
        className="text-xs font-medium text-primary underline underline-offset-2"
      >
        View →
      </Link>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="video_url" value={videoUrl} />
      <input type="hidden" name="video_title" value={videoTitle} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? 'Importing…' : 'Import'}
      </Button>
      {state.ok === false && state.error ? (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  )
}

const initialScan: ScanChannelState = {}

export function ChannelScanner({ workspaceId }: { workspaceId: string }) {
  const [scanState, scanAction] = useFormState(scanChannelAction, initialScan)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <form action={scanAction} className="flex gap-2">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input
            name="channel_url"
            type="url"
            required
            placeholder="https://www.youtube.com/@channelname"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <ScanButton />
        </form>

        {scanState.ok === false ? (
          <FormMessage variant="error" className="mt-3">{scanState.error}</FormMessage>
        ) : null}
      </div>

      {scanState.ok === true ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">{scanState.channelName} — {scanState.videos.length} recent videos</p>
          <div className="divide-y rounded-lg border bg-card">
            {scanState.videos.map((video) => (
              <div key={video.videoId} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{video.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <ImportButton
                  videoUrl={video.url}
                  videoTitle={video.title}
                  workspaceId={workspaceId}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
