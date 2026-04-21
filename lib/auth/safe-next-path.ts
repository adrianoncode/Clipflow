/**
 * Validates a `?next=` param before passing it to redirect(). Plain
 * `startsWith('/')` isn't enough — `//evil.com` starts with `/` but is
 * an open-redirect: the browser treats it as a protocol-relative URL
 * to `evil.com`. Similarly `/\evil.com` is interpreted as `\evil.com`
 * in some parsers.
 *
 * Returns the path unchanged when safe, or the fallback otherwise.
 * Keep this in one place so every login / MFA / callback flow uses
 * the same rule.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!next) return fallback
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//')) return fallback
  if (next.startsWith('/\\')) return fallback
  return next
}
