'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VideoUploadProgress } from '@/components/content/video-upload-progress'
import {
  createVideoContentAction,
  startTranscriptionAction,
  type CreateVideoResult,
  type StartTranscriptionResult,
} from '@/app/(app)/workspace/[id]/content/new/actions'
import {
  ACCEPTED_VIDEO_EXTENSIONS,
  MAX_VIDEO_BYTES,
} from '@/lib/content/schemas'
import { parseExtension } from '@/lib/content/storage-paths'
import { createClient } from '@/lib/supabase/client'

type Phase =
  | { kind: 'idle' }
  | { kind: 'creating' }
  | { kind: 'uploading' }
  | { kind: 'starting' }
  | { kind: 'error'; message: string; code?: string }
  | { kind: 'done' }

const ACCEPT_ATTR = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/ogg',
].join(',')

const initialCreateState: CreateVideoResult = { ok: false, error: '' }
const initialStartState: StartTranscriptionResult = {
  ok: false,
  code: 'unknown',
  error: '',
}

interface VideoUploadFormProps {
  workspaceId: string
  hasOpenAiKey: boolean
}

export function VideoUploadForm({ workspaceId, hasOpenAiKey }: VideoUploadFormProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  const isBusy =
    phase.kind === 'creating' || phase.kind === 'uploading' || phase.kind === 'starting'

  // Warn the user before they close the tab during an active upload.
  useEffect(() => {
    if (!isBusy) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isBusy])

  const reset = useCallback(() => {
    setFile(null)
    setPhase({ kind: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null
    if (!picked) {
      setFile(null)
      setPhase({ kind: 'idle' })
      return
    }
    if (picked.size > MAX_VIDEO_BYTES) {
      setFile(null)
      setPhase({
        kind: 'error',
        message: `File is ${formatBytes(picked.size)}. Whisper accepts up to ${formatBytes(MAX_VIDEO_BYTES)}.`,
      })
      event.target.value = ''
      return
    }
    const ext = parseExtension(picked.name)
    if (!ext) {
      setFile(null)
      setPhase({
        kind: 'error',
        message: `Unsupported format. Supported: ${ACCEPTED_VIDEO_EXTENSIONS.join(', ')}.`,
      })
      event.target.value = ''
      return
    }
    setFile(picked)
    setPhase({ kind: 'idle' })
  }, [])

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!file) return

      const ext = parseExtension(file.name)
      if (!ext) {
        setPhase({ kind: 'error', message: 'Unsupported format.' })
        return
      }

      setPhase({ kind: 'creating' })

      const createForm = new FormData()
      createForm.set('workspace_id', workspaceId)
      createForm.set('filename', file.name)
      createForm.set('ext', ext)
      createForm.set('file_size', String(file.size))
      createForm.set('mime_type', file.type)

      const created = await createVideoContentAction(initialCreateState, createForm)
      if (!created.ok) {
        setPhase({ kind: 'error', message: created.error })
        return
      }

      setPhase({ kind: 'uploading' })

      const supabase = createClient()
      const path = `${workspaceId}/${created.contentId}/source.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(path, file, { upsert: false, contentType: file.type || undefined })

      if (uploadError) {
        setPhase({
          kind: 'error',
          message: `Upload failed: ${uploadError.message}`,
        })
        return
      }

      setPhase({ kind: 'starting' })

      const startForm = new FormData()
      startForm.set('workspace_id', workspaceId)
      startForm.set('content_id', created.contentId)
      startForm.set('ext', ext)

      const started = await startTranscriptionAction(initialStartState, startForm)

      if (started.ok) {
        setPhase({ kind: 'done' })
        router.push(`/workspace/${workspaceId}/content/${created.contentId}`)
        return
      }

      setPhase({
        kind: 'error',
        code: started.code,
        message: started.error,
      })
    },
    [file, router, workspaceId],
  )

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!hasOpenAiKey ? (
        <FormMessage variant="info">
          This workspace doesn&apos;t have an OpenAI key yet. Transcription will fail until you{' '}
          <Link href="/settings/ai-keys" className="underline">
            add one
          </Link>
          .
        </FormMessage>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="video-file">Video or audio file</Label>
        <Input
          id="video-file"
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          onChange={onFileChange}
          disabled={isBusy}
          className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-secondary/80"
        />
        <p className="text-xs text-muted-foreground">
          Up to {formatBytes(MAX_VIDEO_BYTES)}. Accepted: {ACCEPTED_VIDEO_EXTENSIONS.join(', ')}.
        </p>
      </div>

      {file && phase.kind === 'idle' ? (
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <div className="font-medium">{file.name}</div>
          <div className="text-xs text-muted-foreground">
            {formatBytes(file.size)} · {file.type || 'unknown type'}
          </div>
        </div>
      ) : null}

      {phase.kind === 'creating' ? (
        <VideoUploadProgress label="Preparing…" />
      ) : null}
      {phase.kind === 'uploading' ? (
        <VideoUploadProgress label="Uploading to storage…" />
      ) : null}
      {phase.kind === 'starting' ? (
        <VideoUploadProgress label="Transcribing with Whisper…" />
      ) : null}

      {phase.kind === 'error' ? (
        <FormMessage variant="error">
          {phase.message}
          {phase.code === 'no_key' ? (
            <>
              {' '}
              <Link href="/settings/ai-keys" className="underline">
                Add an OpenAI key
              </Link>
              .
            </>
          ) : null}
        </FormMessage>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!file || isBusy}>
          {isBusy ? 'Working…' : 'Upload and transcribe'}
        </Button>
        {file ? (
          <Button type="button" variant="ghost" onClick={reset} disabled={isBusy}>
            Clear
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
