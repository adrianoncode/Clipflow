'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { startDubbingAction } from '@/app/(app)/workspace/[id]/content/[contentId]/dub/actions'
import type { DubJob, StartDubbingState } from '@/app/(app)/workspace/[id]/content/[contentId]/dub/actions'
import { SUPPORTED_LANGUAGES } from '@/lib/dubbing/languages'

interface DubbingClientProps {
  workspaceId: string
  contentId: string
  hasElevenLabsKey: boolean
  sourceHasVideo: boolean
  existingJobs?: DubJob[]
}

const LANGUAGE_FLAGS: Record<string, string> = {
  es: '🇪🇸',
  de: '🇩🇪',
  fr: '🇫🇷',
  pt: '🇵🇹',
  it: '🇮🇹',
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
  ar: '🇸🇦',
  hi: '🇮🇳',
  nl: '🇳🇱',
  pl: '🇵🇱',
  ru: '🇷🇺',
  tr: '🇹🇷',
  sv: '🇸🇪',
}

function SubmitButton({ language }: { language: string | null }) {
  const { pending } = useFormStatus()
  const langLabel = language
    ? (SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label ?? language)
    : '…'

  return (
    <button
      type="submit"
      disabled={pending || !language}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="animate-spin">⏳</span>
          Starting…
        </>
      ) : (
        `Dub to ${langLabel}`
      )}
    </button>
  )
}

function JobRow({ job }: { job: DubJob }) {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === job.targetLanguage)
  const flag = LANGUAGE_FLAGS[job.targetLanguage] ?? '🌍'
  const date = new Date(job.startedAt).toLocaleDateString()

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span>{flag}</span>
        <span className="font-medium">{lang?.label ?? job.targetLanguage}</span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <span
        className={[
          'rounded-full px-2 py-0.5 text-xs font-medium',
          job.status === 'completed'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            : job.status === 'failed'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        ].join(' ')}
      >
        {job.status}
      </span>
    </div>
  )
}

const initialState: StartDubbingState = { ok: undefined }

export function DubbingClient({
  workspaceId,
  contentId,
  hasElevenLabsKey,
  sourceHasVideo,
  existingJobs = [],
}: DubbingClientProps) {
  const [state, formAction] = useFormState(startDubbingAction, initialState)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)

  if (!hasElevenLabsKey) {
    return (
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <div>
            <h3 className="font-semibold">Auto-Dub</h3>
            <p className="text-sm text-muted-foreground">
              Translate and dub your video into another language
            </p>
          </div>
        </div>
        <div className="rounded-md bg-muted p-4 space-y-3">
          <p className="text-sm font-medium">Setup required</p>
          <p className="text-sm text-muted-foreground">
            Auto-dubbing is powered by ElevenLabs. You need an API key to use this feature.
          </p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>
              Sign up at{' '}
              <a
                href="https://elevenlabs.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                elevenlabs.io
              </a>
            </li>
            <li>Go to your profile settings and copy your API key</li>
            <li>
              Add to your environment:{' '}
              <code className="rounded bg-background px-1 py-0.5 text-xs font-mono">
                ELEVENLABS_API_KEY=your_key
              </code>
            </li>
          </ol>
        </div>
      </div>
    )
  }

  if (!sourceHasVideo) {
    return (
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <div>
            <h3 className="font-semibold">Auto-Dub</h3>
            <p className="text-sm text-muted-foreground">
              Auto-dubbing requires an uploaded video file. This content does not have a video source.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const allJobs = state.ok === true
    ? [...existingJobs, { dubbingId: state.dubbingId, targetLanguage: state.targetLanguage, startedAt: new Date().toISOString(), status: 'processing' as const }]
    : existingJobs

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🌍</span>
        <div>
          <h3 className="font-semibold">Auto-Dub</h3>
          <p className="text-sm text-muted-foreground">
            Translate and dub your video into another language using AI voice cloning
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        {selectedLanguage && (
          <input type="hidden" name="target_language" value={selectedLanguage} />
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Select target language</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLanguage(lang.code)}
                className={[
                  'flex flex-col items-center gap-1 rounded-md border p-2 text-xs font-medium transition-colors hover:bg-accent',
                  selectedLanguage === lang.code ? 'border-primary bg-primary/10 text-primary' : '',
                ].join(' ')}
              >
                <span className="text-lg">{LANGUAGE_FLAGS[lang.code] ?? '🌍'}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <SubmitButton language={selectedLanguage} />

        <p className="text-xs text-muted-foreground">
          Dubbing takes 5-15 minutes depending on video length.
        </p>
      </form>

      {state.ok === false && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {allJobs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Dub jobs</p>
          {allJobs.map((job) => (
            <JobRow key={`${job.dubbingId}-${job.targetLanguage}`} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
