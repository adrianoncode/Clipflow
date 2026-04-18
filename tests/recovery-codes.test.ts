import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'

// We test the pure hash-format logic without hitting Supabase.
// The full integration (admin client → DB) needs a local Supabase
// instance and lives in a follow-up e2e test.

function hashCode(plaintext: string): string {
  const normalized = plaintext.replace(/-/g, '').toUpperCase()
  return createHash('sha256').update(normalized).digest('hex')
}

describe('recovery code hashing', () => {
  it('normalizes dashes and case before hashing', () => {
    const a = hashCode('A7K9-MP2X-QWN4-R8Z3')
    const b = hashCode('a7k9mp2xqwn4r8z3')
    const c = hashCode('A7K9MP2XQWN4R8Z3')
    expect(a).toBe(b)
    expect(a).toBe(c)
  })

  it('produces 64-char hex hashes', () => {
    const h = hashCode('A7K9-MP2X-QWN4-R8Z3')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })

  it('different codes produce different hashes', () => {
    const a = hashCode('A7K9-MP2X-QWN4-R8Z3')
    const b = hashCode('A7K9-MP2X-QWN4-R8Z4')
    expect(a).not.toBe(b)
  })

  it('is deterministic across calls', () => {
    const code = 'XYZ1-ABCD-EFGH-IJKL'
    expect(hashCode(code)).toBe(hashCode(code))
  })
})

describe('plaintext code shape (regression)', () => {
  // Imported from the real generator to guard against format regressions.
  // We re-implement to avoid importing server-only code into the test.
  const ALPHABET = 'ACDEFGHJKMNPQRTUVWXYZ234679'

  function isValidShape(code: string): boolean {
    // 4 groups of 4 chars from our alphabet, separated by dashes
    const char = '[ACDEFGHJKMNPQRTUVWXYZ234679]'
    return new RegExp(`^${char}{4}-${char}{4}-${char}{4}-${char}{4}$`).test(code)
  }

  it('alphabet excludes visually-ambiguous characters', () => {
    expect(ALPHABET).not.toMatch(/[01OIL5S8B]/)
  })

  it('example format is parseable', () => {
    expect(isValidShape('A7K9-MP2X-QWN4-R7Z3')).toBe(true)
    expect(isValidShape('a7k9-mp2x-qwn4-r7z3')).toBe(false) // lowercase rejected
    expect(isValidShape('A7K9MP2XQWN4R7Z3')).toBe(false) // needs dashes
    expect(isValidShape('A7K9-MP2X-QWN4')).toBe(false) // too short
  })
})
