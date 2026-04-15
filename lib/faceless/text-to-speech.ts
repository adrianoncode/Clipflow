import 'server-only'

import { resolveServiceKey } from '@/lib/ai/get-service-key'
import { getDefaultVoice } from '@/lib/voice-clone/get-workspace-voice'

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // ElevenLabs "Bella" preset voice

/**
 * Generates speech audio from text using ElevenLabs TTS. BYOK-aware:
 * uses the workspace's connected ElevenLabs key if present, otherwise
 * falls back to the platform key.
 */
export async function textToSpeech(params: {
  text: string
  workspaceId: string
  voiceId?: string
}): Promise<{ ok: true; audioBuffer: Buffer; voiceId: string } | { ok: false; error: string }> {
  const apiKey =
    (await resolveServiceKey(params.workspaceId, 'elevenlabs')) ??
    process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      error: 'ElevenLabs key not connected. Add one in Settings → API Keys.',
    }
  }

  // Resolve voice: explicit > workspace default > global default
  let voiceId = params.voiceId
  if (!voiceId) {
    const defaultVoice = await getDefaultVoice(params.workspaceId)
    voiceId = defaultVoice?.elevenlabs_voice_id ?? DEFAULT_VOICE_ID
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: params.text.slice(0, 5000),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `ElevenLabs TTS error ${res.status}: ${err.slice(0, 200)}` }
    }

    const arrayBuffer = await res.arrayBuffer()
    return { ok: true, audioBuffer: Buffer.from(arrayBuffer), voiceId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'TTS failed' }
  }
}
