import 'server-only'

import { resolveServiceKey } from '@/lib/ai/get-service-key'

/**
 * Clones a voice via ElevenLabs Instant Voice Cloning API.
 * BYOK-aware: uses the workspace's connected key when provided.
 */
export async function cloneVoice(params: {
  name: string
  audioBuffer: Buffer
  fileName: string
  workspaceId?: string
}): Promise<{ ok: true; voiceId: string } | { ok: false; error: string }> {
  const apiKey =
    (params.workspaceId
      ? await resolveServiceKey(params.workspaceId, 'elevenlabs')
      : null) ?? process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      error: 'ElevenLabs key not connected. Add one in Settings → AI Connections.',
    }
  }

  try {
    const formData = new FormData()
    formData.append('name', params.name)
    formData.append('files', new Blob([new Uint8Array(params.audioBuffer)]), params.fileName)

    const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData,
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `ElevenLabs error ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = await res.json() as { voice_id?: string }
    if (!data.voice_id) return { ok: false, error: 'No voice ID returned' }

    return { ok: true, voiceId: data.voice_id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Lists available ElevenLabs voices (for selection).
 */
export async function listElevenLabsVoices(
  workspaceId?: string,
): Promise<
  { ok: true; voices: Array<{ voice_id: string; name: string }> } | { ok: false; error: string }
> {
  const apiKey =
    (workspaceId ? await resolveServiceKey(workspaceId, 'elevenlabs') : null) ??
    process.env.ELEVENLABS_API_KEY
  if (!apiKey)
    return {
      ok: false,
      error: 'ElevenLabs key not connected. Add one in Settings → AI Connections.',
    }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    })
    if (!res.ok) return { ok: false, error: `ElevenLabs error ${res.status}` }
    const data = await res.json() as { voices?: Array<{ voice_id: string; name: string }> }
    return { ok: true, voices: data.voices ?? [] }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to list voices' }
  }
}
