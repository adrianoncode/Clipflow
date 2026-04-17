import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, type EncryptedPayload } from '@/lib/crypto/encryption'

describe('AES-256-GCM encryption', () => {
  it('roundtrips a short plaintext', () => {
    const plaintext = 'sk-abc123-real-openai-like-string'
    const payload = encrypt(plaintext)
    expect(decrypt(payload)).toBe(plaintext)
  })

  it('roundtrips a long plaintext (100KB)', () => {
    const plaintext = 'x'.repeat(100_000)
    const payload = encrypt(plaintext)
    expect(decrypt(payload)).toBe(plaintext)
  })

  it('produces different IV + ciphertext on every call (non-deterministic)', () => {
    const plaintext = 'same-input-every-time'
    const a = encrypt(plaintext)
    const b = encrypt(plaintext)
    expect(a.iv).not.toBe(b.iv)
    expect(a.ciphertext).not.toBe(b.ciphertext)
    // Both still decrypt to the same thing
    expect(decrypt(a)).toBe(plaintext)
    expect(decrypt(b)).toBe(plaintext)
  })

  it('returns base64-encoded fields with the right shape', () => {
    const p = encrypt('hello')
    // Base64 pattern
    expect(p.ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/)
    expect(p.iv).toMatch(/^[A-Za-z0-9+/=]+$/)
    expect(p.authTag).toMatch(/^[A-Za-z0-9+/=]+$/)
    // IV is 12 bytes = 16 chars base64 with padding
    expect(Buffer.from(p.iv, 'base64').length).toBe(12)
    // Auth tag is 16 bytes
    expect(Buffer.from(p.authTag, 'base64').length).toBe(16)
  })

  it('detects tampered ciphertext (GCM auth failure)', () => {
    const plaintext = 'top-secret'
    const payload = encrypt(plaintext)
    // Flip one byte in the ciphertext
    const raw = Buffer.from(payload.ciphertext, 'base64')
    raw[0] = raw[0]! ^ 0xff
    const tampered: EncryptedPayload = { ...payload, ciphertext: raw.toString('base64') }
    expect(() => decrypt(tampered)).toThrow()
  })

  it('detects tampered auth tag', () => {
    const payload = encrypt('sensitive')
    const tag = Buffer.from(payload.authTag, 'base64')
    tag[0] = tag[0]! ^ 0xff
    const tampered: EncryptedPayload = { ...payload, authTag: tag.toString('base64') }
    expect(() => decrypt(tampered)).toThrow()
  })
})
