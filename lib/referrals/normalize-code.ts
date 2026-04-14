/**
 * Referral codes live in three places (URL, cookie, database) and users
 * will copy-paste them with whatever casing and whitespace they please.
 * Normalize eagerly so every lookup goes through the same shape.
 */
export function normalizeReferralCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cleaned = raw.trim().toUpperCase()
  // 8 chars from the generator's alphabet — reject anything longer/shorter
  // to avoid hitting the DB with obvious garbage.
  if (!/^[A-Z0-9]{4,16}$/.test(cleaned)) return null
  return cleaned
}
