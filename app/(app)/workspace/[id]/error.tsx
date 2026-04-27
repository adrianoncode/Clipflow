'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

/**
 * Workspace-segment error boundary. Without this file a thrown error in
 * any nested workspace route (content, outputs, pipeline, schedule,
 * members, research) bubbles up to the root app/error.tsx and takes the
 * entire app shell + sidebar with it. Catching at the workspace
 * boundary keeps the nav intact so users can back out to another route
 * instead of being stranded on a blank screen.
 */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { segment: 'workspace' } })
  }, [error])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-8">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#FBEDD9' }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: '#A0530B' }} />
        </div>
        <div>
          <p
            className="mb-1 font-bold text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: '#7c7468' }}
          >
            Workspace error
          </p>
          <h1
            className="text-[28px] leading-[1.05]"
            style={{
              fontFamily: 'var(--font-instrument-serif), serif',
              color: '#2A1A3D',
              letterSpacing: '-.015em',
            }}
          >
            That page failed to load.
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#7c7468' }}>
            {error.message ||
              'A transient error hit the workspace data layer. Try again, or jump back to the dashboard.'}
          </p>
          {error.digest ? (
            <p
              className="mt-2 font-bold text-[10px] uppercase tracking-[0.18em]"
              style={{ color: '#7c7468' }}
            >
              Ref · {error.digest}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold"
          style={{
            background: '#2A1A3D',
            color: '#D6FF3E',
            boxShadow:
              'inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(42,26,61,.35)',
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold"
          style={{ borderColor: '#E5DDCE', color: '#3a342c' }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
