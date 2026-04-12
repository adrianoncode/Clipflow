import 'server-only'

export interface AvatarVideoResult {
  ok: true
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
}

// HeyGen API stub
// Docs: https://docs.heygen.com/reference/create-an-avatar-video-v2
export async function generateAvatarVideo(params: {
  script: string
  avatarId?: string // HeyGen avatar ID
  voiceId?: string  // HeyGen voice ID
}): Promise<AvatarVideoResult | { ok: false; error: string }> {
  const apiKey = process.env.HEYGEN_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'HeyGen API key not configured. Add HEYGEN_API_KEY to environment variables. Get your key at heygen.com' }
  }

  try {
    const res = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: params.avatarId ?? 'Anna_public_3_20240108',
          },
          voice: {
            type: 'text',
            input_text: params.script.slice(0, 1500),
            voice_id: params.voiceId ?? '1bd001e7e50f421d891986aad5158bc8',
          },
        }],
        dimension: { width: 1080, height: 1920 }, // 9:16 vertical
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `HeyGen error: ${res.status} — ${err}` }
    }

    const data = await res.json()
    return {
      ok: true,
      jobId: data.data?.video_id ?? '',
      status: 'pending',
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
