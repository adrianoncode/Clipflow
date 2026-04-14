/**
 * Copy `text` to the user's clipboard with a fallback for contexts where
 * `navigator.clipboard` is unavailable (HTTP in dev, older browsers,
 * focus-gated prompts). Returns `true` on success, `false` if every
 * approach failed — callers should surface a manual-copy hint in that case.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern path — requires secure context (https or localhost).
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to legacy path.
    }
  }

  // Legacy path — works on HTTP and older browsers. The hidden textarea
  // lets us reuse the document's selection API.
  if (typeof document !== 'undefined') {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.top = '0'
      ta.style.left = '0'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }

  return false
}
