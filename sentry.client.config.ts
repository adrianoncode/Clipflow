/**
 * Sentry client-side setup. Runs in the browser.
 *
 * Gracefully no-ops when NEXT_PUBLIC_SENTRY_DSN is not set, so the
 * local dev experience and preview deploys without a Sentry project
 * don't emit warnings.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Performance monitoring — 10% transaction sampling in prod, 0% in dev.
    // Browser-side traces capture pageviews, navigations, and resource
    // timings. Combined with tracePropagationTargets below, traces flow
    // from browser → server → Supabase for end-to-end latency insight.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    // Distributed tracing: only propagate trace headers to our own
    // domains so we don't leak trace context to third-party CDNs.
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/clipflow\.to/,
      /^https:\/\/.*\.vercel\.app/,
    ],

    // Session replay: 100% of errored sessions, 1% of normal sessions.
    // Zero cost in dev because we don't init without a DSN.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.01,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask everything sensitive by default — user-generated content
        // (drafts, transcripts) may contain PII.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Drop noisy / known-bad errors before they hit Sentry.
    beforeSend(event, hint) {
      const err = hint.originalException
      if (err instanceof Error) {
        // Browser extension crashes we can't fix
        if (err.message.includes('ResizeObserver loop')) return null
        if (err.message.includes('Non-Error promise rejection captured')) return null
      }
      return event
    },
  })
}
