import 'server-only'

import { TwitterApi } from 'twitter-api-v2'

import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt, type EncryptedPayload } from '@/lib/crypto/encryption'
import { log } from '@/lib/log'

/**
 * Post to X (Twitter) using the user's BYO OAuth 1.0a credentials.
 *
 * Storage decision: X credentials live encrypted inside
 * `workspaces.branding.channels.x.credentials` (an EncryptedPayload
 * JSON blob). We don't reuse the `ai_keys` table because that would
 * require extending the Postgres enum + regenerating Supabase types,
 * which is a bigger migration than this single feature warrants.
 */

export interface XCredentials {
  consumerKey: string
  consumerSecret: string
  accessToken: string
  accessTokenSecret: string
}

export interface XPublishInput {
  text: string
  videoUrl?: string
}

export type XPublishResult =
  | { ok: true; tweetId: string }
  | { ok: false; error: string; code: 'missing_key' | 'api_error' | 'too_long' }

export async function publishToX(
  workspaceId: string,
  input: XPublishInput,
): Promise<XPublishResult> {
  if (input.text.length > 280) {
    return {
      ok: false,
      error: 'Tweet exceeds 280 characters. Trim it first.',
      code: 'too_long',
    }
  }

  const creds = await loadXCredentials(workspaceId)
  if (!creds) {
    return {
      ok: false,
      error: 'X API credentials not connected. Go to Settings → Channels.',
      code: 'missing_key',
    }
  }

  const client = buildClient(creds)
  try {
    const tweet = await client.v2.tweet(input.text)
    return { ok: true, tweetId: tweet.data.id }
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Unknown X API error'
    log.error('x-publish: tweet failed', err as Error, { workspaceId })
    return { ok: false, error: msg, code: 'api_error' }
  }
}

/**
 * Probe a set of credentials by calling /users/me. Used by the Connect
 * flow to fail fast before saving bad creds.
 */
export async function verifyXCredentials(
  creds: XCredentials,
): Promise<{ ok: true; handle: string } | { ok: false; error: string }> {
  const client = buildClient(creds)
  try {
    const me = await client.v2.me()
    return { ok: true, handle: me.data.username }
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Authentication failed'
    return { ok: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildClient(creds: XCredentials): TwitterApi {
  return new TwitterApi({
    appKey: creds.consumerKey,
    appSecret: creds.consumerSecret,
    accessToken: creds.accessToken,
    accessSecret: creds.accessTokenSecret,
  })
}

async function loadXCredentials(workspaceId: string): Promise<XCredentials | null> {
  try {
    const supabase = createAdminClient()
    const { data: ws } = await supabase
      .from('workspaces')
      .select('branding')
      .eq('id', workspaceId)
      .single()
    const branding = (ws?.branding ?? {}) as Record<string, unknown>
    const channels = (branding.channels ?? {}) as Record<string, unknown>
    const xSlot = (channels.x ?? null) as
      | { credentials?: EncryptedPayload }
      | null
    if (!xSlot?.credentials) return null
    const plaintext = decrypt(xSlot.credentials)
    return JSON.parse(plaintext) as XCredentials
  } catch {
    return null
  }
}
