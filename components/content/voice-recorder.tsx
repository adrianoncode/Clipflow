'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Square, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  createVideoContentAction,
  startTranscriptionAction,
  type CreateVideoResult,
  type StartTranscriptionResult,
} from '@/app/(app)/workspace/[id]/content/new/actions'
import { createClient } from '@/lib/supabase/client'

export interface VoiceRecorderProps {
  workspaceId: string
  onCreated?: (contentId: string) => void
}

type RecorderState =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'processing' }
  | { kind: 'done'; contentId: string }
  | { kind: 'error'; message: string }

const initialCreateState: CreateVideoResult = { ok: false, error: '' }
const initialStartState: StartTranscriptionResult = { ok: false, code: 'unknown', error: '' }

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function VoiceRecorder({ workspaceId, onCreated }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>({ kind: 'idle' })
  const [elapsed, setElapsed] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Tracks whether the component is still mounted — `uploadRecording`
  // runs through three async steps and any of them can resolve after
  // the user navigates away. Without this we get "setState on
  // unmounted component" warnings and the upload proceeds orphaned.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  const safeSetState = (next: RecorderState) => {
    if (mountedRef.current) setState(next)
  }

  // Tick timer while recording
  useEffect(() => {
    if (state.kind === 'recording') {
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - state.startedAt)
      }, 500)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const handleRecord = useCallback(async () => {
    setState({ kind: 'requesting' })
    chunksRef.current = []

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setState({ kind: 'error', message: 'Microphone access denied. Please allow microphone permission and try again.' })
      return
    }

    streamRef.current = stream

    // Pick a supported MIME type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
      ? 'audio/ogg;codecs=opus'
      : ''

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stopStream()
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      await uploadRecording(blob, recorder.mimeType)
    }

    recorder.start(250) // collect chunks every 250ms
    setState({ kind: 'recording', startedAt: Date.now() })
  }, [stopStream]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setState({ kind: 'processing' })
      mediaRecorderRef.current.stop()
    }
  }, [])

  const handleCancel = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Detach onstop so we don't process the recording
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    stopStream()
    setState({ kind: 'idle' })
    chunksRef.current = []
  }, [stopStream])

  const uploadRecording = useCallback(
    async (blob: Blob, mimeType: string) => {
      safeSetState({ kind: 'processing' })

      const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
      const filename = `recording.${ext}`
      const file = new File([blob], filename, { type: mimeType || 'audio/webm' })

      const createForm = new FormData()
      createForm.set('workspace_id', workspaceId)
      createForm.set('filename', filename)
      createForm.set('ext', ext)
      createForm.set('file_size', String(file.size))
      createForm.set('mime_type', file.type)

      const created = await createVideoContentAction(initialCreateState, createForm)
      if (!created.ok) {
        safeSetState({ kind: 'error', message: created.error })
        return
      }

      const supabase = createClient()
      const path = `${workspaceId}/${created.contentId}/source.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(path, file, { upsert: false, contentType: file.type || undefined })

      if (uploadError) {
        safeSetState({ kind: 'error', message: `Upload failed: ${uploadError.message}` })
        return
      }

      const startForm = new FormData()
      startForm.set('workspace_id', workspaceId)
      startForm.set('content_id', created.contentId)
      startForm.set('ext', ext)

      const started = await startTranscriptionAction(initialStartState, startForm)

      if (started.ok) {
        safeSetState({ kind: 'done', contentId: created.contentId })
        // Fire the callback even if unmounted — the parent may have
        // navigated intentionally (e.g. to the new content page) and
        // still wants to know the ID for analytics / reveal logic.
        onCreated?.(created.contentId)
        return
      }

      safeSetState({ kind: 'error', message: started.error })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- safeSetState
    // is stable (wraps mountedRef) and can't be memoized without breaking
    // the closure-over-latest-mounted semantics.
    [workspaceId, onCreated],
  )

  // ---- Render ----

  if (state.kind === 'idle') {
    return (
      <Button type="button" variant="outline" onClick={handleRecord} className="gap-2">
        <Mic className="h-4 w-4" />
        Record voice
      </Button>
    )
  }

  if (state.kind === 'requesting') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Requesting microphone…
      </div>
    )
  }

  if (state.kind === 'recording') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <span className="text-sm font-medium">
            Recording {formatElapsed(elapsed)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleStop}
            className="gap-1"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop
          </Button>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    )
  }

  if (state.kind === 'processing') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Uploading recording…
      </div>
    )
  }

  if (state.kind === 'done') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Recording uploaded —{' '}
        <Link
          href={`/workspace/${workspaceId}/content/${state.contentId}`}
          className="underline underline-offset-2"
        >
          View content →
        </Link>
      </div>
    )
  }

  // error state
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 text-sm text-destructive">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {state.message}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setState({ kind: 'idle' })}
      >
        Try again
      </Button>
    </div>
  )
}
