import { describe, it, expect } from 'vitest'
import { isPublicUrl } from '@/lib/security/is-public-url'
import { verifyCronSecret, verifyEnvSecret } from '@/lib/security/verify-cron-secret'
import { escapePostgrestIlikeValue } from '@/lib/security/postgrest-escape'

describe('isPublicUrl — SSRF guard', () => {
  it('allows public https URLs', async () => {
    const res = await isPublicUrl('https://example.com/path')
    expect(res.ok).toBe(true)
  })

  it('blocks loopback IPv4', async () => {
    const res = await isPublicUrl('http://127.0.0.1/admin')
    expect(res.ok).toBe(false)
  })

  it('blocks AWS metadata endpoint (169.254.169.254)', async () => {
    const res = await isPublicUrl('http://169.254.169.254/latest/meta-data/iam/security-credentials')
    expect(res.ok).toBe(false)
  })

  it('blocks private 192.168.x range', async () => {
    const res = await isPublicUrl('http://192.168.1.1/')
    expect(res.ok).toBe(false)
  })

  it('blocks private 10.0.0.0/8 range', async () => {
    const res = await isPublicUrl('http://10.0.0.1:8080/internal')
    expect(res.ok).toBe(false)
  })

  it('blocks non-http schemes (file://)', async () => {
    const res = await isPublicUrl('file:///etc/passwd')
    expect(res.ok).toBe(false)
  })

  it('blocks IPv6 loopback ::1', async () => {
    const res = await isPublicUrl('http://[::1]/admin')
    expect(res.ok).toBe(false)
  })

  it('rejects malformed URL', async () => {
    const res = await isPublicUrl('not-a-url')
    expect(res.ok).toBe(false)
  })
})

describe('verifyCronSecret — timing-safe auth', () => {
  it('rejects empty / missing secret', () => {
    expect(verifyCronSecret(null)).toBe(false)
    expect(verifyCronSecret(undefined)).toBe(false)
    expect(verifyCronSecret('')).toBe(false)
  })

  it('rejects incorrect secret', () => {
    expect(verifyCronSecret('wrong-secret')).toBe(false)
  })

  it('accepts exact match against CRON_SECRET env', () => {
    expect(verifyCronSecret(process.env.CRON_SECRET!)).toBe(true)
  })

  it('rejects when CRON_SECRET is too short (fail-closed)', () => {
    const orig = process.env.CRON_SECRET
    process.env.CRON_SECRET = 'short'
    try {
      expect(verifyCronSecret('short')).toBe(false)
    } finally {
      process.env.CRON_SECRET = orig
    }
  })

  it('verifyEnvSecret works for Shotstack webhook secret', () => {
    expect(verifyEnvSecret('SHOTSTACK_WEBHOOK_SECRET', process.env.SHOTSTACK_WEBHOOK_SECRET!)).toBe(true)
    expect(verifyEnvSecret('SHOTSTACK_WEBHOOK_SECRET', 'wrong')).toBe(false)
  })

  it('verifyEnvSecret fails closed on missing env var', () => {
    expect(verifyEnvSecret('NONEXISTENT_ENV_VAR', 'anything')).toBe(false)
  })
})

describe('escapePostgrestIlikeValue — PostgREST filter-injection guard', () => {
  it('strips PostgREST filter delimiters', () => {
    expect(escapePostgrestIlikeValue('a,workspace_id.neq.xxx')).not.toContain(',')
    expect(escapePostgrestIlikeValue('a,workspace_id.neq.xxx')).not.toContain('.')
  })

  it('preserves normal alphanumeric strings', () => {
    expect(escapePostgrestIlikeValue('hello world')).toBe('hello world')
  })

  it('clamps excessive length', () => {
    const long = 'x'.repeat(1000)
    expect(escapePostgrestIlikeValue(long).length).toBeLessThanOrEqual(100)
  })

  it('collapses whitespace and trims', () => {
    expect(escapePostgrestIlikeValue('  foo   bar  ')).toBe('foo bar')
  })

  it('handles injection payload gracefully', () => {
    const payload = 'a),workspace_id.neq.00000000-0000-0000-0000-000000000000'
    const safe = escapePostgrestIlikeValue(payload)
    expect(safe).not.toContain(')')
    expect(safe).not.toContain(',')
    expect(safe).not.toContain('.')
  })
})
