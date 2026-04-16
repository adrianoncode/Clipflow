'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { generateAvatarAction } from '@/app/(app)/workspace/[id]/content/[contentId]/avatar/actions'
import type { GenerateAvatarState } from '@/app/(app)/workspace/[id]/content/[contentId]/avatar/actions'

interface AvatarClientProps {
  workspaceId: string
  contentId: string
  transcript: string | null
  hasHeyGenKey: boolean
  existingJob?: {
    jobId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    videoUrl?: string
    startedAt?: string
  } | null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="animate-spin">⏳</span>
          Generating…
        </>
      ) : (
        'Generate avatar video'
      )}
    </button>
  )
}

const initialState: GenerateAvatarState = { ok: undefined }

export function AvatarClient({
  workspaceId,
  contentId,
  transcript,
  hasHeyGenKey,
  existingJob,
}: AvatarClientProps) {
  const [state, formAction] = useFormState(generateAvatarAction, initialState)

  if (!hasHeyGenKey) {
    return (
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎭</span>
          <div>
            <h3 className="font-semibold">AI Avatar Video</h3>
            <p className="text-sm text-muted-foreground">
              Generate a talking head video of an AI avatar reading your script
            </p>
          </div>
        </div>

        <div className="rounded-md bg-muted p-4 space-y-3">
          <p className="text-sm font-medium">Setup required</p>
          <p className="text-sm text-muted-foreground">
            AI Avatar generation is powered by HeyGen. You need a HeyGen API key to use this feature.
          </p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>
              Sign up at{' '}
              <a
                href="https://www.heygen.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                heygen.com
              </a>
            </li>
            <li>Go to API settings and generate an API key</li>
            <li>
              Add to your environment: <code className="rounded bg-background px-1 py-0.5 text-xs font-mono">HEYGEN_API_KEY=your_key</code>
            </li>
          </ol>
        </div>
      </div>
    )
  }

  const defaultScript = transcript?.slice(0, 500) ?? ''
  const currentJob = state.ok === true ? { jobId: state.jobId, status: state.status, videoUrl: state.videoUrl } : existingJob

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎭</span>
        <div>
          <h3 className="font-semibold">AI Avatar Video</h3>
          <p className="text-sm text-muted-foreground">
            Generate a talking head video of an AI avatar reading your script
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />

        <div className="space-y-2">
          <label htmlFor="avatar-script" className="text-sm font-medium">
            Script{' '}
            <span className="font-normal text-muted-foreground">(max 1500 characters)</span>
          </label>
          <textarea
            id="avatar-script"
            name="script_override"
            rows={6}
            defaultValue={defaultScript}
            maxLength={1500}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Enter the script for the avatar to read…"
          />
          <p className="text-xs text-muted-foreground">
            Pre-filled from your transcript. Edit as needed.
          </p>
        </div>

        <SubmitButton />
      </form>

      {state.ok === false && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {currentJob && (
        <div className="rounded-md border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Avatar video job</p>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                currentJob.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : currentJob.status === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700',
              ].join(' ')}
            >
              {currentJob.status}
            </span>
          </div>

          {currentJob.status === 'pending' || currentJob.status === 'processing' ? (
            <p className="text-sm text-muted-foreground">
              Generating AI avatar video... This takes 2-5 minutes.
            </p>
          ) : null}

          {currentJob.status === 'completed' && currentJob.videoUrl ? (
            <video
              controls
              src={currentJob.videoUrl}
              className="w-full rounded-md"
            />
          ) : currentJob.status === 'completed' && !currentJob.videoUrl ? (
            <p className="text-sm text-muted-foreground">
              Video is ready — check your HeyGen dashboard to download it.
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground font-mono">Job ID: {currentJob.jobId}</p>
        </div>
      )}
    </div>
  )
}
