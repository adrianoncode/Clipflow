/**
 * Sentry server-side setup. Runs in Node.js / Vercel serverless.
 *
 * No-ops when SENTRY_DSN is not set.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    // Never send request bodies — they may contain API keys, draft text,
    // or other workspace-private content.
    sendDefaultPii: false,

    beforeSend(event) {
      // Strip Authorization / Cookie headers defensively
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['Authorization']
        delete event.request.headers['cookie']
        delete event.request.headers['Cookie']
      }
      return event
    },
  })
}
