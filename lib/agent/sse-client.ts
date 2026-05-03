/**
 * Tiny SSE reader for the agent chat client. The browser's built-in
 * EventSource only supports GET; our /api/agent/chat is POST (we send
 * the message body), so we drive the stream manually via fetch +
 * ReadableStream.
 *
 * Yields one parsed frame per `\n\n` block. Frames must follow the
 * server's named-event format (`event: <name>` + `data: <json>`).
 */
export interface SseFrame {
  event: string
  data: string
}

export async function* readSseStream(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<SseFrame> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel().catch(() => undefined)
        return
      }

      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      while (true) {
        const idx = buffer.indexOf('\n\n')
        if (idx < 0) break
        const block = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        const frame = parseBlock(block)
        if (frame) yield frame
      }
    }

    // Flush any trailing partial frame (server should always end on \n\n,
    // but tolerate proxies that strip the final blank line).
    if (buffer.length > 0) {
      const frame = parseBlock(buffer)
      if (frame) yield frame
    }
  } finally {
    reader.releaseLock()
  }
}

function parseBlock(block: string): SseFrame | null {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith(':')) continue // SSE comment / heartbeat
    if (line.startsWith('event: ')) {
      event = line.slice(7).trim()
    } else if (line.startsWith('data: ')) {
      dataLines.push(line.slice(6))
    }
  }
  if (dataLines.length === 0) return null
  return { event, data: dataLines.join('\n') }
}
