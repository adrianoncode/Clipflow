/**
 * Next.js instrumentation hook — called once at server/edge startup.
 * Loads the right Sentry config for the current runtime.
 *
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Sentry 10+ React Server Components integration — lets errors thrown
// inside RSCs / server actions propagate to Sentry with full context.
export { captureRequestError as onRequestError } from '@sentry/nextjs'
