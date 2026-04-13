import 'server-only'

export interface InstagramProfile {
  username: string
  displayName: string
  bio: string
  followers: number
  following: number
  posts: number
  avatar: string | null
  isVerified: boolean
}

/**
 * Fetches public Instagram profile data.
 * Uses the ?__a=1&__d=dis endpoint for JSON data.
 */
export async function scrapeInstagramProfile(
  username: string,
): Promise<{ ok: true; profile: InstagramProfile } | { ok: false; error: string }> {
  const cleanUsername = username.replace(/^@/, '').trim()
  if (!cleanUsername) return { ok: false, error: 'Invalid username' }

  try {
    // Try the web profile info endpoint
    const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'X-IG-App-ID': '936619743392459',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      // Fallback: try scraping the HTML page
      return scrapeInstagramHtml(cleanUsername)
    }

    const data = await res.json() as {
      data?: {
        user?: {
          username?: string
          full_name?: string
          biography?: string
          edge_followed_by?: { count?: number }
          edge_follow?: { count?: number }
          edge_owner_to_timeline_media?: { count?: number }
          profile_pic_url_hd?: string
          is_verified?: boolean
        }
      }
    }

    const user = data?.data?.user
    if (!user) return { ok: false, error: 'Profile not found' }

    return {
      ok: true,
      profile: {
        username: user.username ?? cleanUsername,
        displayName: user.full_name ?? cleanUsername,
        bio: user.biography ?? '',
        followers: user.edge_followed_by?.count ?? 0,
        following: user.edge_follow?.count ?? 0,
        posts: user.edge_owner_to_timeline_media?.count ?? 0,
        avatar: user.profile_pic_url_hd ?? null,
        isVerified: user.is_verified ?? false,
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Fetch failed' }
  }
}

async function scrapeInstagramHtml(
  username: string,
): Promise<{ ok: true; profile: InstagramProfile } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { ok: false, error: `Instagram returned ${res.status}` }

    const html = await res.text()

    // Try to extract meta description for basic stats
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/)

    const desc = descMatch?.[1] ?? ''
    const title = titleMatch?.[1] ?? username

    // Parse "1.2M Followers, 500 Following, 300 Posts" pattern
    const followersMatch = desc.match(/([\d,.]+[KMB]?)\s*Followers/i)
    const followingMatch = desc.match(/([\d,.]+[KMB]?)\s*Following/i)
    const postsMatch = desc.match(/([\d,.]+[KMB]?)\s*Posts/i)

    return {
      ok: true,
      profile: {
        username,
        displayName: title.split('(')[0]?.trim() ?? username,
        bio: desc.split(' - ').slice(1).join(' - ').trim(),
        followers: parseCount(followersMatch?.[1] ?? '0'),
        following: parseCount(followingMatch?.[1] ?? '0'),
        posts: parseCount(postsMatch?.[1] ?? '0'),
        avatar: null,
        isVerified: false,
      },
    }
  } catch {
    return { ok: false, error: 'Could not fetch Instagram profile' }
  }
}

function parseCount(s: string): number {
  const clean = s.replace(/,/g, '')
  if (clean.endsWith('K')) return Math.round(parseFloat(clean) * 1000)
  if (clean.endsWith('M')) return Math.round(parseFloat(clean) * 1_000_000)
  if (clean.endsWith('B')) return Math.round(parseFloat(clean) * 1_000_000_000)
  return parseInt(clean, 10) || 0
}
