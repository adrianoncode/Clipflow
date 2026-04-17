/**
 * Vitest global setup — seed deterministic env vars for modules that
 * read them at import time (e.g. `lib/env.ts`, `lib/crypto/encryption.ts`).
 *
 * Real secrets should never be hardcoded here; these are only for the
 * crypto/billing/cron helpers whose unit tests don't need real Supabase.
 */
import crypto from 'node:crypto'
import { vi } from 'vitest'

// ── lib/env.ts requires these at import time ──────────────────────────
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon-test-key-00000000000000000000000000'
process.env.NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'service-role-test-key-00000000000000000000000000'

// 32-byte hex key — valid shape for AES-256-GCM unit tests.
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ?? crypto.randomBytes(32).toString('hex')
process.env.CRON_SECRET =
  process.env.CRON_SECRET ?? 'test-cron-secret-' + crypto.randomBytes(16).toString('hex')
process.env.SHOTSTACK_WEBHOOK_SECRET =
  process.env.SHOTSTACK_WEBHOOK_SECRET ?? 'test-shotstack-' + crypto.randomBytes(16).toString('hex')

// Prevent `import 'server-only'` from throwing during unit tests.
// The real package only errors in Next.js client bundles anyway.
vi.mock('server-only', () => ({}))
