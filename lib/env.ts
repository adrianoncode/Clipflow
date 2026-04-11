import { z } from 'zod'

/**
 * Environment contract for Clipflow.
 *
 * This module is imported by every server-side Supabase/crypto helper and
 * validates `process.env` once at first import. Any missing or malformed value
 * fails fast here — we never want to reach a customer-facing code path with a
 * half-configured environment.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

const serverSchema = clientSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/u, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),
})

export type ClientEnv = z.infer<typeof clientSchema>
export type ServerEnv = z.infer<typeof serverSchema>

const rawClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}

const parsedClient = clientSchema.safeParse(rawClientEnv)
if (!parsedClient.success) {
  throw new Error(
    `[clipflow] Invalid public environment variables:\n${parsedClient.error.issues
      .map((i) => ` - ${i.path.join('.')}: ${i.message}`)
      .join('\n')}`,
  )
}

export const clientEnv: ClientEnv = parsedClient.data

/**
 * Lazily parses server-only env vars. Calling this from a client bundle will
 * always throw because `SUPABASE_SERVICE_ROLE_KEY` and `ENCRYPTION_KEY` are
 * never exposed via NEXT_PUBLIC_.
 */
let _serverEnv: ServerEnv | null = null
export function serverEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv

  const parsed = serverSchema.safeParse({
    ...rawClientEnv,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  })

  if (!parsed.success) {
    throw new Error(
      `[clipflow] Invalid server environment variables:\n${parsed.error.issues
        .map((i) => ` - ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`,
    )
  }

  _serverEnv = parsed.data
  return _serverEnv
}
