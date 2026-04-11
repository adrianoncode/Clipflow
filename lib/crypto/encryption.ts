import 'server-only'

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import { serverEnv } from '@/lib/env'

/**
 * AES-256-GCM envelope encryption for BYOK AI keys.
 *
 * - Master key: `ENCRYPTION_KEY` (64 hex chars = 32 bytes)
 * - IV: 12 random bytes per payload (GCM standard nonce length)
 * - Auth tag: 16 bytes, separated from ciphertext so the shape matches how
 *   Postgres `bytea` columns can be round-tripped via `@supabase/supabase-js`
 *
 * Returns and accepts base64-encoded strings so callers can hand them
 * straight to `supabase.from('ai_keys').insert(...)`.
 *
 * This file is marked server-only — Node `crypto` is not available in the
 * Edge runtime, so never import it from middleware.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // bytes
const KEY_LENGTH = 32 // bytes

export interface EncryptedPayload {
  ciphertext: string // base64
  iv: string // base64
  authTag: string // base64
}

function getKey(): Buffer {
  const { ENCRYPTION_KEY } = serverEnv()
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  if (key.length !== KEY_LENGTH) {
    throw new Error(`[encryption] ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes`)
  }
  return key
}

export function encrypt(plaintext: string): EncryptedPayload {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

export function decrypt(payload: EncryptedPayload): string {
  const key = getKey()
  const iv = Buffer.from(payload.iv, 'base64')
  const authTag = Buffer.from(payload.authTag, 'base64')
  const ciphertext = Buffer.from(payload.ciphertext, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}
