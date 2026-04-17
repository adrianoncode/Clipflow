import 'server-only'

/**
 * Escapes a user-supplied string for safe use inside a PostgREST `.or()`
 * or `.filter()` value where we can't avoid string interpolation.
 *
 * PostgREST uses these characters as filter-syntax delimiters:
 *   , ( ) . : *
 *
 * We strip them from user input so an attacker cannot inject extra
 * filter clauses (e.g. `a,workspace_id.neq.XXX` to break RLS scoping
 * on the current filter tree).
 *
 * Also clamps length to prevent ReDoS / massive wildcard scans.
 */
export function escapePostgrestValue(value: string, maxLen = 100): string {
  return value
    .replace(/[,()*:.\\%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

/**
 * Same as above but preserves `%` (needed for ilike wildcards) — only
 * use when you build the wildcard pattern yourself, not from user input.
 */
export function escapePostgrestIlikeValue(value: string, maxLen = 100): string {
  return value
    .replace(/[,()*:.\\%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}
