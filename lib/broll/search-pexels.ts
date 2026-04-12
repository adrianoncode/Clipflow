import 'server-only'

// NOTE: PEXELS_API_KEY must be set in Vercel environment variables as well as .env.local

export interface PexelsVideo {
  id: number
  url: string // pexels page URL
  duration: number // seconds
  width: number
  height: number
  thumbnail: string // preview image URL
  videoUrl: string // direct MP4 URL (SD quality)
  photographer: string
}

export interface PexelsPhoto {
  id: number
  url: string
  width: number
  height: number
  photographer: string
  src: {
    medium: string
    large: string
    original: string
  }
  alt: string | null
}

export async function searchPexelsVideos(query: string, perPage = 9): Promise<PexelsVideo[]> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return []

  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
      { headers: { Authorization: key }, next: { revalidate: 3600 } },
    )
    if (!res.ok) return []
    const data = await res.json()

    return (data.videos ?? [])
      .map((v: {
        id: number
        url: string
        duration: number
        width: number
        height: number
        image: string
        video_files?: Array<{ quality: string; link: string }>
        user?: { name: string }
      }) => {
        const sdFile =
          v.video_files?.find((f) => f.quality === 'sd') ?? v.video_files?.[0]
        return {
          id: v.id,
          url: v.url,
          duration: v.duration,
          width: v.width,
          height: v.height,
          thumbnail: v.image,
          videoUrl: sdFile?.link ?? '',
          photographer: v.user?.name ?? 'Unknown',
        }
      })
      .filter((v: PexelsVideo) => v.videoUrl)
  } catch {
    return []
  }
}

export async function searchPexelsPhotos(query: string, perPage = 9): Promise<PexelsPhoto[]> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return []

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
      { headers: { Authorization: key }, next: { revalidate: 3600 } },
    )
    if (!res.ok) return []
    const data = await res.json()

    return (data.photos ?? []).map((p: {
      id: number
      url: string
      width: number
      height: number
      photographer: string
      src?: { medium: string; large: string; original: string }
      alt?: string
    }) => ({
      id: p.id,
      url: p.url,
      width: p.width,
      height: p.height,
      photographer: p.photographer,
      src: {
        medium: p.src?.medium ?? '',
        large: p.src?.large ?? '',
        original: p.src?.original ?? '',
      },
      alt: p.alt ?? null,
    }))
  } catch {
    return []
  }
}
