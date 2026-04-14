/**
 * A small deny-list of the most common throwaway-inbox providers. The
 * list is intentionally conservative (only obviously-disposable hosts)
 * so we don't accidentally reject real users who happen to use privacy
 * forwarders. Kept in code so changes are reviewable via git.
 *
 * When a signup email matches this list, the referral is recorded as
 * `status='blocked'` instead of `pending`, preventing self-refer abuse
 * (user refers themselves via a throwaway inbox to farm the coupon).
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'sharklasers.com',
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'trashmail.com',
  'trashmail.net',
  'yopmail.com',
  'temp-mail.org',
  'tempmail.com',
  'throwawaymail.com',
  'getnada.com',
  'mailnesia.com',
  'maildrop.cc',
  'dispostable.com',
  'fakeinbox.com',
  'spam4.me',
  'mintemail.com',
  'mohmal.com',
  'mytemp.email',
  'emailondeck.com',
  'grr.la',
  'harakirimail.com',
  'inboxbear.com',
  'trbvm.com',
])

export function isDisposableEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const at = email.lastIndexOf('@')
  if (at < 0) return false
  const domain = email.slice(at + 1).trim().toLowerCase()
  return DISPOSABLE_DOMAINS.has(domain)
}
