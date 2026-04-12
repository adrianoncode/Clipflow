import 'server-only'

export interface ReframeJobResult {
  ok: true
  jobId: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed'
  outputUrl?: string
}

export interface ReframeJobError {
  ok: false
  error: string
}

// Start a reframing job on Replicate
// Uses the video-reframing model to crop landscape video to 9:16 portrait
export async function startReframeJob(
  videoUrl: string,
  aspectRatio: '9:16' | '1:1' | '4:5' = '9:16'
): Promise<ReframeJobResult | ReframeJobError> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return { ok: false, error: 'Replicate API token not configured' }

  try {
    // Use Replicate REST API directly (no SDK dependency issues)
    // Model: lucataco/video-reframe - crops video to target aspect ratio with smart centering
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=30', // wait up to 30s for quick jobs
      },
      body: JSON.stringify({
        // ffmpeg-based center crop model - reliable, fast
        version: 'c72dce8b4cddcc41e86e87b78c4765c3c02e7ea8d580e96af4c01e2ad5a08d3b',
        input: {
          video_path: videoUrl,
          aspect_ratio: aspectRatio,
          crop_type: 'center', // center crop as default, smart crop when face detection available
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      void err // consumed for potential debugging
      // If model version not found, return a helpful error
      if (res.status === 422 || res.status === 404) {
        return { ok: false, error: 'Reframe model not available. Please check Replicate model configuration.' }
      }
      return { ok: false, error: `Replicate error: ${res.status}` }
    }

    const prediction = await res.json() as { id: string; status: string; output?: string | string[] }
    return {
      ok: true,
      jobId: prediction.id,
      status: prediction.status as ReframeJobResult['status'],
      outputUrl: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Poll job status
export async function getReframeJobStatus(
  jobId: string
): Promise<ReframeJobResult | ReframeJobError> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return { ok: false, error: 'Replicate API token not configured' }

  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false, error: `Replicate error: ${res.status}` }
    const prediction = await res.json() as { id: string; status: string; output?: string | string[] }
    return {
      ok: true,
      jobId: prediction.id,
      status: prediction.status as ReframeJobResult['status'],
      outputUrl: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
