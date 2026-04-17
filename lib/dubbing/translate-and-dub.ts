import 'server-only'

import { resolveServiceKey } from '@/lib/ai/get-service-key'

// ElevenLabs Dubbing API
// Docs: https://elevenlabs.io/docs/api-reference/dubbing
export async function startDubbingJob(params: {
  audioUrl: string  // source audio URL
  targetLanguage: string // e.g. 'es', 'de', 'fr', 'pt', 'ja', 'ko', 'zh'
  sourceLanguage?: string
  workspaceId?: string
}): Promise<{ ok: true; dubbingId: string } | { ok: false; error: string }> {
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
    formData.append('target_lang', params.targetLanguage)
    if (params.sourceLanguage) formData.append('source_lang', params.sourceLanguage)
    formData.append('mode', 'automatic')
    formData.append('source_url', params.audioUrl)

    const res = await fetch('https://api.elevenlabs.io/v1/dubbing', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData,
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `ElevenLabs error: ${res.status} — ${err}` }
    }

    const data = await res.json()
    return { ok: true, dubbingId: data.dubbing_id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export { SUPPORTED_LANGUAGES } from '@/lib/dubbing/languages'
