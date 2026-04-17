import { describe, it, expect } from 'vitest'
import { ok, fail, isOk, type ActionResult } from '@/lib/actions/result'

describe('lib/actions/result', () => {
  it('ok() without args returns bare success', () => {
    const r = ok()
    expect(r.ok).toBe(true)
    expect(isOk(r)).toBe(true)
  })

  it('ok(data) spreads data into the success branch', () => {
    const r = ok({ id: 'abc', count: 5 })
    expect(r).toEqual({ ok: true, id: 'abc', count: 5 })
  })

  it('fail returns { ok: false, error }', () => {
    const r = fail('Nope.')
    expect(r).toEqual({ ok: false, error: 'Nope.' })
  })

  it('fail with code attaches the code', () => {
    const r = fail('No key connected.', 'no_key')
    expect(r).toEqual({ ok: false, error: 'No key connected.', code: 'no_key' })
  })

  it('isOk narrows union type correctly', () => {
    const result: ActionResult<{ thingId: string }> = ok({ thingId: 'xyz' })
    if (isOk(result)) {
      // In the success branch, thingId must be accessible
      expect(result.thingId).toBe('xyz')
    } else {
      throw new Error('expected success branch')
    }
  })

  it('narrowing on failure gives access to error/code', () => {
    const result: ActionResult<{ id: string }> = fail('boom', 'db_error')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('boom')
      expect(result.code).toBe('db_error')
    }
  })
})
