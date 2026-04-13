import 'server-only'

const BASE_URL = 'https://api.scrapecreators.com/v1'
const API_KEY = process.env.SCRAPECREATORS_API_KEY

interface ApiResponse<T> {
  ok: true
  data: T
}

interface ApiError {
  ok: false
  error: string
}

async function fetchApi<T>(path: string): Promise<ApiResponse<T> | ApiError> {
  if (!API_KEY) return { ok: false, error: 'ScrapeCreators API key not configured. Add SCRAPECREATORS_API_KEY to env.' }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'x-api-key': API_KEY },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      return { ok: false, error: `API error ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = await res.json()
    return { ok: true, data: data as T }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'API request failed' }
  }
}

/* ─── TikTok ───────────────────────────────────────────── */

export interface TikTokUser {
  username: string
  nickname: string
  bio: string
  followers: number
  following: number
  likes: number
  videos: number
  avatar: string
  verified: boolean
}

export async function getTikTokProfile(username: string) {
  const clean = username.replace(/^@/, '')
  return fetchApi<TikTokUser>(`/tiktok/profile?username=${encodeURIComponent(clean)}`)
}

export async function searchTikTok(query: string) {
  return fetchApi<{ users: TikTokUser[] }>(`/tiktok/search/users?query=${encodeURIComponent(query)}`)
}

export interface TikTokVideo {
  id: string
  description: string
  likes: number
  comments: number
  shares: number
  views: number
  created_at: string
  video_url: string
  thumbnail: string
}

export async function getTikTokVideos(username: string) {
  const clean = username.replace(/^@/, '')
  return fetchApi<{ videos: TikTokVideo[] }>(`/tiktok/videos?username=${encodeURIComponent(clean)}`)
}

/* ─── Instagram ────────────────────────────────────────── */

export interface InstagramUser {
  username: string
  full_name: string
  bio: string
  followers: number
  following: number
  posts: number
  avatar: string
  verified: boolean
  external_url: string | null
}

export async function getInstagramProfile(username: string) {
  const clean = username.replace(/^@/, '')
  return fetchApi<InstagramUser>(`/instagram/profile?username=${encodeURIComponent(clean)}`)
}

export interface InstagramPost {
  id: string
  caption: string
  likes: number
  comments: number
  type: string
  thumbnail: string
  created_at: string
}

export async function getInstagramPosts(username: string) {
  const clean = username.replace(/^@/, '')
  return fetchApi<{ posts: InstagramPost[] }>(`/instagram/posts?username=${encodeURIComponent(clean)}`)
}

/* ─── YouTube ──────────────────────────────────────────── */

export async function getYouTubeChannel(channelId: string) {
  return fetchApi<Record<string, unknown>>(`/youtube/channel?id=${encodeURIComponent(channelId)}`)
}

/* ─── LinkedIn ─────────────────────────────────────────── */

export interface LinkedInProfile {
  name: string
  headline: string
  about: string
  followers: number
  connections: number
  location: string
  avatar: string
}

export async function getLinkedInProfile(profileUrl: string) {
  return fetchApi<LinkedInProfile>(`/linkedin/person?url=${encodeURIComponent(profileUrl)}`)
}

/* ─── Twitter/X ────────────────────────────────────────── */

export interface TwitterUser {
  username: string
  name: string
  bio: string
  followers: number
  following: number
  tweets: number
  avatar: string
  verified: boolean
}

export async function getTwitterProfile(username: string) {
  const clean = username.replace(/^@/, '')
  return fetchApi<TwitterUser>(`/twitter/profile?username=${encodeURIComponent(clean)}`)
}

/* ─── Reddit ───────────────────────────────────────────── */

export async function getSubreddit(name: string) {
  return fetchApi<Record<string, unknown>>(`/reddit/subreddit?name=${encodeURIComponent(name)}`)
}

/* ─── Multi-platform search ────────────────────────────── */

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'twitter'

export interface CreatorResult {
  platform: Platform
  username: string
  displayName: string
  bio: string
  followers: number
  avatar: string | null
  verified: boolean
  extra: Record<string, unknown>
}

/**
 * Unified creator lookup — fetches profile from any supported platform.
 */
export async function lookupCreator(
  platform: Platform,
  usernameOrUrl: string,
): Promise<{ ok: true; creator: CreatorResult } | { ok: false; error: string }> {
  switch (platform) {
    case 'tiktok': {
      const res = await getTikTokProfile(usernameOrUrl)
      if (!res.ok) return res
      const d = res.data
      return { ok: true, creator: { platform, username: d.username, displayName: d.nickname, bio: d.bio, followers: d.followers, avatar: d.avatar, verified: d.verified, extra: { likes: d.likes, videos: d.videos, following: d.following } } }
    }
    case 'instagram': {
      const res = await getInstagramProfile(usernameOrUrl)
      if (!res.ok) return res
      const d = res.data
      return { ok: true, creator: { platform, username: d.username, displayName: d.full_name, bio: d.bio, followers: d.followers, avatar: d.avatar, verified: d.verified, extra: { posts: d.posts, following: d.following } } }
    }
    case 'twitter': {
      const res = await getTwitterProfile(usernameOrUrl)
      if (!res.ok) return res
      const d = res.data
      return { ok: true, creator: { platform, username: d.username, displayName: d.name, bio: d.bio, followers: d.followers, avatar: d.avatar, verified: d.verified, extra: { tweets: d.tweets, following: d.following } } }
    }
    case 'linkedin': {
      const res = await getLinkedInProfile(usernameOrUrl)
      if (!res.ok) return res
      const d = res.data
      return { ok: true, creator: { platform, username: usernameOrUrl, displayName: d.name, bio: d.about, followers: d.followers, avatar: d.avatar, verified: false, extra: { headline: d.headline, connections: d.connections, location: d.location } } }
    }
    default:
      return { ok: false, error: `Platform "${platform}" not supported.` }
  }
}
