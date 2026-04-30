'use client'

/**
 * Global error boundary — catches errors thrown in the root layout
 * itself, which `app/error.tsx` cannot. Required by Next.js 14 for
 * Sentry to capture crashes at the outermost boundary.
 *
 * Must include its own <html>/<body> because the root layout is what
 * crashed — the normal layout tree isn't available.
 */
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF7F2',
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(120,90,40,.05) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          color: '#181511',
          margin: 0,
          padding: '1rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.25em',
              color: '#7c7468',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '3rem',
              lineHeight: 1.02,
              letterSpacing: '-0.015em',
              color: '#0F0F0F',
              fontWeight: 400,
              margin: 0,
              marginBottom: 12,
            }}
          >
            Crashed hard.
          </h1>
          <p style={{ fontSize: 14, color: '#7c7468', marginBottom: 20 }}>
            An unexpected error occurred. We&apos;ve been notified and are looking into it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 10,
              border: 'none',
              background: '#0F0F0F',
              color: '#F4D93D',
              cursor: 'pointer',
              boxShadow:
                'inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(15,15,15,.35)',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
