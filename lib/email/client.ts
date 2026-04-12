import { Resend } from 'resend'

/**
 * Singleton Resend client.
 * Returns null when RESEND_API_KEY is not set so callers can skip gracefully
 * in dev without crashing.
 */
export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

/**
 * The "from" address used for all outbound emails.
 * Must be a verified domain/address in your Resend account.
 * Falls back to Resend's sandbox address in dev (works without domain verification,
 * but can only send to your own verified email).
 */
export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'Clipflow <onboarding@resend.dev>'
}
