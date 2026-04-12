import 'server-only'

export interface AvatarVideoResult {
  ok: true
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
}

// D-ID API — Talking Avatar Video Generation
// Docs: https://docs.d-id.com/reference/createtalk
export async function generateAvatarVideo(params: {
  script: string
  presenterImageUrl?: string // URL of the avatar image (defaults to D-ID stock presenter)
  voiceId?: string           // D-ID voice ID
}): Promise<AvatarVideoResult | { ok: false; error: string }> {
  const apiKey = process.env.DID_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      error: 'D-ID API key not configured. Add DID_API_KEY to environment variables. Get your key at studio.d-id.com',
    }
  }

  try {
    const res = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: params.presenterImageUrl ?? 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg',
        script: {
          type: 'text',
          input: params.script.slice(0, 1500),
          provider: {
            type: 'microsoft',
            voice_id: params.voiceId ?? 'en-US-JennyNeural',
          },
        },
        config: {
          fluent: true,
          pad_audio: 0,
          result_format: 'mp4',
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `D-ID error: ${res.status} — ${err}` }
    }

    const data = await res.json()
    return {
      ok: true,
      jobId: data.id ?? '',
      status: data.status === 'done' ? 'completed' : 'pending',
      videoUrl: data.result_url ?? undefined,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Poll job status
export async function getAvatarJobStatus(
  jobId: string
): Promise<AvatarVideoResult | { ok: false; error: string }> {
  const apiKey = process.env.DID_API_KEY
  if (!apiKey) return { ok: false, error: 'D-ID API key not configured' }

  try {
    const res = await fetch(`https://api.d-id.com/talks/${jobId}`, {
      headers: { Authorization: `Basic ${apiKey}` },
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false, error: `D-ID error: ${res.status}` }
    const data = await res.json()

    const status =
      data.status === 'done' ? 'completed'
      : data.status === 'error' ? 'failed'
      : data.status === 'started' ? 'processing'
      : 'pending'

    return {
      ok: true,
      jobId: data.id,
      status,
      videoUrl: data.result_url ?? undefined,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
