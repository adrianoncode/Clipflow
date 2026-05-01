import 'server-only'

/**
 * Read a Response body with a hard byte cap.
 *
 * Plain `await res.text()` reads the entire body into memory before we
 * can decide it's too large — a malicious URL returning a multi-GB
 * response will OOM the Node lambda before user code runs. Stream the
 * body chunk-by-chunk and abort the moment we cross the cap.
 *
 * Why not trust `Content-Length`? Servers can lie or omit it. We DO
 * use it as a fast-fail (reject obviously huge before reading), but
 * still enforce the byte cap streaming.
 */
export async function readBoundedText(
  res: Response,
  maxBytes: number,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const declared = res.headers.get('content-length')
  if (declared) {
    const n = Number(declared)
    if (Number.isFinite(n) && n > maxBytes) {
      return {
        ok: false,
        error: `Response too large (${(n / 1_000_000).toFixed(1)}MB exceeds ${(maxBytes / 1_000_000).toFixed(1)}MB cap).`,
      }
    }
  }

  if (!res.body) {
    // No streaming body (HEAD response, error before body). Fall back
    // to a bounded-size text read.
    const text = await res.text()
    if (text.length > maxBytes) {
      return { ok: false, error: 'Response too large.' }
    }
    return { ok: true, text }
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let total = 0
  const chunks: string[] = []

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        return {
          ok: false,
          error: `Response exceeded ${(maxBytes / 1_000_000).toFixed(1)}MB cap.`,
        }
      }
      chunks.push(decoder.decode(value, { stream: true }))
    }
    chunks.push(decoder.decode())
  } catch (err) {
    return {
      ok: false,
      error: `Failed reading response body: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }

  return { ok: true, text: chunks.join('') }
}
