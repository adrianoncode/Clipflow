import 'server-only'

export interface TikTokProfile {
  username: string
  displayName: string
  bio: string
  followers: number
  following: number
  likes: number
  avatar: string | null
}

/**
 * Fetches public TikTok profile data by scraping the profile page.
 * Only accesses publicly available information.
 */
export async function scrapeTikTokProfile(
  username: string,
): Promise<{ ok: true; profile: TikTokProfile } | { ok: false; error: string }> {
  const cleanUsername = username.replace(/^@/, '').trim()
  if (!cleanUsername) return { ok: false, error: 'Invalid username' }

  try {
    const res = await fetch(`https://www.tiktok.com/@${cleanUsername}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { ok: false, error: `TikTok returned ${res.status}` }

    const html = await res.text()

    // Extract __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON blob
    const dataMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/)
    if (!dataMatch?.[1]) {
      // Fallback: try SIGI_STATE
      const sigiMatch = html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/)
      if (!sigiMatch?.[1]) {
        return { ok: false, error: 'Could not parse TikTok profile data' }
      }

      try {
        const sigi = JSON.parse(sigiMatch[1])
        const userModule = sigi?.UserModule?.users?.[cleanUsername]
        const statsModule = sigi?.UserModule?.stats?.[cleanUsername]

        return {
          ok: true,
          profile: {
            username: cleanUsername,
            displayName: userModule?.nickname ?? cleanUsername,
            bio: userModule?.signature ?? '',
            followers: statsModule?.followerCount ?? 0,
            following: statsModule?.followingCount ?? 0,
            likes: statsModule?.heartCount ?? 0,
            avatar: userModule?.avatarMedium ?? null,
          },
        }
      } catch {
        return { ok: false, error: 'Failed to parse SIGI data' }
      }
    }

    try {
      const data = JSON.parse(dataMatch[1])
      const userInfo = data?.['__DEFAULT_SCOPE__']?.['webapp.user-detail']?.userInfo
      const user = userInfo?.user
      const stats = userInfo?.stats

      if (!user) return { ok: false, error: 'Profile not found' }

      return {
        ok: true,
        profile: {
          username: user.uniqueId ?? cleanUsername,
          displayName: user.nickname ?? cleanUsername,
          bio: user.signature ?? '',
          followers: stats?.followerCount ?? 0,
          following: stats?.followingCount ?? 0,
          likes: stats?.heartCount ?? 0,
          avatar: user.avatarMedium ?? null,
        },
      }
    } catch {
      return { ok: false, error: 'Failed to parse profile data' }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Fetch failed' }
  }
}
