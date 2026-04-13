'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormState } from 'react-dom'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { startReframeAction, type StartReframeState } from '@/app/(app)/workspace/[id]/content/[contentId]/reframe/actions'

type AspectRatio = '9:16' | '1:1' | '4:5'

const ASPECT_OPTIONS: {
  value: AspectRatio
  label: string
  description: string
  width: number
  height: number
}[] = [
  { value: '9:16', label: '9:16', description: 'TikTok / Reels / Shorts', width: 54, height: 96 },
  { value: '1:1', label: '1:1', description: 'Instagram Square', width: 72, height: 72 },
  { value: '4:5', label: '4:5', description: 'Instagram Portrait', width: 72, height: 90 },
]

interface ReframeClientProps {
  workspaceId: string
  contentId: string
  videoUrl: string | null
  existingJob?: { jobId: string; aspectRatio: string } | null
  hasReplicateKey: boolean
}

interface PollResult {
  ok: boolean
  status?: string
  outputUrl?: string
  error?: string
}

export function ReframeClient({
  workspaceId,
  contentId,
  videoUrl,
  existingJob,
  hasReplicateKey,
}: ReframeClientProps) {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:16')
  const [jobId, setJobId] = useState<string | null>(existingJob?.jobId ?? null)
  const [jobStatus, setJobStatus] = useState<string | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [pollError, setPollError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const initialState: StartReframeState = {}
  const [actionState, formAction] = useFormState(startReframeAction, initialState)
  const [isPending, _setIsPending] = useState(false)

  // When action succeeds, capture the jobId
  useEffect(() => {
    if (actionState.ok === true && actionState.jobId) {
      setJobId(actionState.jobId)
      setJobStatus('starting')
      setOutputUrl(null)
      setPollError(null)
    }
  }, [actionState])

  // Polling loop
  useEffect(() => {
    if (!jobId) return
    if (jobStatus === 'succeeded' || jobStatus === 'failed') return

    const poll = async () => {
      try {
        const res = await fetch(`/api/reframe?jobId=${jobId}`)
        const data = await res.json() as PollResult
        if (!data.ok) {
          setPollError(data.error ?? 'Failed to poll job status.')
          clearInterval(intervalRef.current!)
          return
        }
        setJobStatus(data.status ?? null)
        if (data.status === 'succeeded') {
          setOutputUrl(data.outputUrl ?? null)
          clearInterval(intervalRef.current!)
        } else if (data.status === 'failed') {
          setPollError('Reframing job failed on Replicate. Please try again.')
          clearInterval(intervalRef.current!)
        }
      } catch {
        setPollError('Network error while polling job status.')
        clearInterval(intervalRef.current!)
      }
    }

    // Poll immediately then every 3s
    void poll()
    intervalRef.current = setInterval(poll, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [jobId, jobStatus])

  const isProcessing = jobStatus === 'starting' || jobStatus === 'processing'
  const isDone = jobStatus === 'succeeded'

  // No Replicate key configured
  if (!hasReplicateKey) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-8">
        <div className="space-y-1">
          <Link
            href={`/workspace/${workspaceId}/content/${contentId}`}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Back to content
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Auto-Reframe</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Replicate API Key Required</CardTitle>
            <CardDescription>
              Auto-Reframe requires a Replicate API key to process videos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Add <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">REPLICATE_API_TOKEN</code> to your environment variables.</p>
            <p>
              Get your key at{' '}
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                replicate.com/account/api-tokens
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <div className="space-y-1">
        <Link
          href={`/workspace/${workspaceId}/content/${contentId}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to content
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Auto-Reframe</h1>
        <p className="text-sm text-muted-foreground">
          Crop your landscape video to vertical formats for social media.
        </p>
      </div>

      {/* Video preview + result side by side */}
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Original video */}
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Original (16:9)</p>
          {videoUrl ? (
            <div className="aspect-video overflow-hidden rounded-lg border bg-black">
              <video
                src={videoUrl}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
              No preview available
            </div>
          )}
        </div>

        {/* Reframed video */}
        {isDone && outputUrl ? (
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Reframed ({selectedRatio})
            </p>
            <div
              className="overflow-hidden rounded-lg border bg-black"
              style={{
                aspectRatio: selectedRatio === '9:16' ? '9/16' : selectedRatio === '1:1' ? '1/1' : '4/5',
              }}
            >
              <video
                src={outputUrl}
                controls
                className="h-full w-full object-contain"
              />
            </div>
            <a
              href={outputUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              ↓ Download Reframed Video
            </a>
          </div>
        ) : null}
      </div>

      {/* Aspect ratio selector */}
      {!isProcessing && !isDone ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Aspect Ratio</CardTitle>
            <CardDescription>Choose the target format for your reframed video.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {ASPECT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedRatio(opt.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                    selectedRatio === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {/* Visual ratio rectangle */}
                  <div
                    className={`rounded border-2 ${
                      selectedRatio === opt.value ? 'border-primary bg-primary/20' : 'border-muted-foreground bg-muted'
                    }`}
                    style={{ width: opt.width / 2, height: opt.height / 2 }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <form action={formAction}>
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="contentId" value={contentId} />
              <input type="hidden" name="aspectRatio" value={selectedRatio} />
              <Button type="submit" disabled={isPending || !videoUrl}>
                {isPending ? 'Starting…' : '↕ Auto-Reframe'}
              </Button>
            </form>

            {actionState.ok === false && actionState.error ? (
              <p className="text-sm text-destructive">{actionState.error}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Processing state */}
      {isProcessing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reframing video with AI…</CardTitle>
            <CardDescription>
              This typically takes 1–3 minutes depending on video length.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full animate-pulse rounded-full bg-primary" style={{ width: '60%' }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Status: {jobStatus ?? 'starting'}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Done — show retry option */}
      {isDone ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reframing complete</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => {
                setJobId(null)
                setJobStatus(null)
                setOutputUrl(null)
                setPollError(null)
              }}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Reframe again with different settings
            </button>
          </CardContent>
        </Card>
      ) : null}

      {/* Poll error */}
      {pollError ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Reframing failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{pollError}</p>
            <button
              type="button"
              onClick={() => {
                setJobId(null)
                setJobStatus(null)
                setOutputUrl(null)
                setPollError(null)
              }}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
