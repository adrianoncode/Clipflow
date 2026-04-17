/**
 * Shared result-type for server actions and lib functions.
 *
 * Replaces the per-file `{ ok: true, ... } | { ok: false, error }` shapes
 * that were duplicated in 85+ files.
 *
 * Usage:
 *
 *   import { ok, fail, type ActionResult } from '@/lib/actions/result'
 *
 *   export async function createThing(id: string): Promise<ActionResult<{ thingId: string }>> {
 *     if (!id) return fail('Missing id.', 'validation_error')
 *     const thingId = await db.create(id)
 *     return ok({ thingId })
 *   }
 *
 * Callers consume with a plain truthy check on `.ok`:
 *
 *   const res = await createThing('abc')
 *   if (!res.ok) return res  // res.error + optional res.code
 *   res.thingId              // narrowed to success branch
 */

/**
 * Well-known error codes. Kept here so callers can switch exhaustively
 * instead of string-matching error messages. Add codes by appending —
 * never remove a code (backwards compat).
 */
export type ActionErrorCode =
  | 'unauthorized'         // no user / wrong workspace
  | 'forbidden'            // user is logged in but lacks permission
  | 'not_found'            // row doesn't exist
  | 'validation_error'     // Zod / input parse failed
  | 'no_key'               // BYOK key not connected
  | 'quota_exceeded'       // plan limit hit
  | 'rate_limited'         // rate-limit bucket empty
  | 'decrypt_failed'       // AES-GCM auth failure
  | 'db_error'             // Supabase query error
  | 'provider_error'       // upstream AI / API provider error
  | 'timeout'              // action exceeded its budget
  | 'already_processing'   // dedupe guard
  | 'content_not_ready'    // content_items.status !== 'ready'
  | 'unknown'              // catch-all — prefer specific codes

export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : T))
  | { ok: false; error: string; code?: ActionErrorCode }

/**
 * Success constructor. Pass data inline or a plain object.
 *
 *   ok()                     // { ok: true }
 *   ok({ id: 'abc' })        // { ok: true, id: 'abc' }
 */
export function ok(): ActionResult<void>
export function ok<T extends object>(data: T): ActionResult<T>
export function ok<T extends object>(data?: T): ActionResult<T> {
  if (!data) return { ok: true } as ActionResult<T>
  return { ok: true, ...data } as ActionResult<T>
}

/**
 * Failure constructor. Message is user-facing — avoid leaking raw DB errors.
 *
 *   fail('Not found.', 'not_found')
 */
export function fail(error: string, code?: ActionErrorCode): { ok: false; error: string; code?: ActionErrorCode } {
  return code ? { ok: false, error, code } : { ok: false, error }
}

/**
 * Type guard — narrows a result to the success branch.
 */
export function isOk<T>(result: ActionResult<T>): result is Extract<ActionResult<T>, { ok: true }> {
  return result.ok === true
}
