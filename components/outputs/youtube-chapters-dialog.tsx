'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { generateYoutubeChaptersAction, type ChapterState } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/predict-actions'

interface Props {
  workspaceId: string
  contentId: string
}

export function YoutubeChaptersDialog({ workspaceId, contentId }: Props) {
  const initialState: ChapterState = {}
  const [state, formAction] = useFormState(generateYoutubeChaptersAction, initialState)
  const [copied, setCopied] = useState(false)

  const chaptersText = state.ok === true
    ? state.chapters.map((c) => `${c.timestamp} ${c.title}`).join('\n')
    : ''

  function handleCopy() {
    navigator.clipboard.writeText(chaptersText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">YouTube Chapters</h3>
          <p className="text-xs text-muted-foreground">Auto-generate chapter markers from your transcript</p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="content_id" value={contentId} />
          <Button type="submit" size="sm" variant="outline">
            Generate chapters
          </Button>
        </form>
      </div>

      {state.ok === false && <FormMessage variant="error">{state.error}</FormMessage>}

      {state.ok === true && state.chapters.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-4">
            <pre className="whitespace-pre-wrap text-sm text-foreground">
              {chaptersText}
            </pre>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy to clipboard'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste this into your YouTube video description to enable chapter navigation.
          </p>
        </div>
      )}
    </div>
  )
}
