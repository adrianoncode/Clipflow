'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Report to Sentry and log. Sentry no-ops when DSN is unset, so local
    // dev still just prints to the console.
    Sentry.captureException(error)
    console.error(error)
  }, [error])

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{
        background: '#FAF7F2',
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(120,90,40,.05) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: -160,
          right: -100,
          width: 440,
          height: 440,
          background: '#D6FF3E',
          borderRadius: '50%',
          filter: 'blur(60px)',
          opacity: 0.45,
          mixBlendMode: 'multiply',
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: '#FBEDD9' }}
        >
          <AlertTriangle className="h-6 w-6" style={{ color: '#A0530B' }} />
        </div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.25em]"
          style={{ color: '#7c7468', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          Something went sideways
        </p>
        <h1
          className="text-[48px] leading-[1] sm:text-[64px]"
          style={{
            fontFamily: 'var(--font-instrument-serif), serif',
            letterSpacing: '-.015em',
            color: '#0F0F0F',
          }}
        >
          That didn&apos;t work.
        </h1>
        <p className="max-w-md text-[15px]" style={{ color: '#7c7468' }}>
          {error.message ||
            "We've logged the error. Try again, or head back to the dashboard and we'll pick up where you left off."}
        </p>
        {error.digest ? (
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: '#7c7468', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            Ref · {error.digest}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] px-5 text-sm font-bold transition-transform hover:-translate-y-0.5"
            style={{
              background: '#0F0F0F',
              color: '#D6FF3E',
              boxShadow:
                'inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(15,15,15,.35)',
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border px-5 text-sm font-semibold transition-colors"
            style={{
              borderColor: '#E5DDCE',
              color: '#3a342c',
              background: 'transparent',
            }}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
