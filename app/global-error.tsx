'use client'

/**
 * Global error boundary — catches errors thrown in the root layout
 * itself, which `app/error.tsx` cannot. Required by Next.js 14 for
 * Sentry to capture crashes at the outermost boundary.
 *
 * Must include its own <html>/<body> because the root layout is what
 * crashed.
 */
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
