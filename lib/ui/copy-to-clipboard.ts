/**
 * Copies text to the clipboard, falling back to `document.execCommand`
 * when the Clipboard API isn't available (e.g. HTTP contexts, Safari
 * denial, third-party iframes).
 *
 * Always returns — never throws — so call sites don't need try/catch
 * wrappers. The boolean tells callers whether to show the "copied"
 * confirmation or a "copy failed" toast.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // Modern path — only available on HTTPS and in focused documents.
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to legacy path
    }
  }

  // Legacy fallback: hidden textarea + execCommand. Works even in
  // non-secure contexts where the Clipboard API is blocked.
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    // Avoid scrolling the page while we do this.
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
