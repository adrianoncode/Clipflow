import 'server-only'
import { lookup } from 'node:dns/promises'
import net from 'node:net'

/**
 * SSRF guard. Rejects URLs that could be used to hit internal services,
 * cloud-metadata endpoints, or the loopback interface.
 *
 * Blocks:
 *   - Non-http(s) schemes (file://, ftp://, gopher://, data:)
 *   - Hostnames that resolve to private/loopback/link-local IPs
 *   - Direct private IP literals (127.0.0.1, 10.x.x.x, 192.168.x.x, …)
 *   - IPv6 loopback (::1) and unique-local (fc00::/7)
 *   - AWS/GCP/Azure metadata endpoint (169.254.169.254)
 *
 * Usage:
 *   const ok = await isPublicUrl(userUrl)
 *   if (!ok.ok) return { ok: false, error: ok.reason }
 */
export type PublicUrlCheck = { ok: true; url: URL } | { ok: false; reason: string }

const PRIVATE_V4_RANGES: Array<[number, number]> = [
  // 10.0.0.0/8
  [ipToInt('10.0.0.0'), ipToInt('10.255.255.255')],
  // 172.16.0.0/12
  [ipToInt('172.16.0.0'), ipToInt('172.31.255.255')],
  // 192.168.0.0/16
  [ipToInt('192.168.0.0'), ipToInt('192.168.255.255')],
  // 127.0.0.0/8 loopback
  [ipToInt('127.0.0.0'), ipToInt('127.255.255.255')],
  // 169.254.0.0/16 link-local (includes AWS metadata 169.254.169.254)
  [ipToInt('169.254.0.0'), ipToInt('169.254.255.255')],
  // 0.0.0.0/8
  [ipToInt('0.0.0.0'), ipToInt('0.255.255.255')],
  // 100.64.0.0/10 carrier-grade NAT
  [ipToInt('100.64.0.0'), ipToInt('100.127.255.255')],
]

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number)
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0
}

function isPrivateV4(ip: string): boolean {
  const n = ipToInt(ip)
  return PRIVATE_V4_RANGES.some(([lo, hi]) => n >= lo && n <= hi)
}

function isPrivateV6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === '::1' || normalized === '::') return true
  // fc00::/7 unique-local
  if (/^f[cd]/.test(normalized)) return true
  // fe80::/10 link-local
  if (/^fe[89ab]/.test(normalized)) return true
  // ::ffff:10.0.0.0 IPv4-mapped — check the v4 part
  const v4Match = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (v4Match) return isPrivateV4(v4Match[1]!)
  return false
}

export async function isPublicUrl(rawUrl: string): Promise<PublicUrlCheck> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'Invalid URL.' }
  }

  // Only http(s)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: `Only http(s) URLs are allowed (got ${url.protocol}).` }
  }

  const hostname = url.hostname
  if (!hostname) return { ok: false, reason: 'URL has no hostname.' }

  // Direct IP literal
  const ipFamily = net.isIP(hostname)
  if (ipFamily === 4) {
    if (isPrivateV4(hostname)) {
      return { ok: false, reason: 'URL points to a private or internal IP address.' }
    }
    return { ok: true, url }
  }
  if (ipFamily === 6) {
    if (isPrivateV6(hostname)) {
      return { ok: false, reason: 'URL points to a private or internal IPv6 address.' }
    }
    return { ok: true, url }
  }

  // Hostname — resolve DNS and check every returned address
  let addrs: Array<{ address: string; family: number }>
  try {
    addrs = await lookup(hostname, { all: true })
  } catch {
    return { ok: false, reason: 'Could not resolve hostname.' }
  }

  for (const { address, family } of addrs) {
    if (family === 4 && isPrivateV4(address)) {
      return { ok: false, reason: 'Hostname resolves to a private IP address.' }
    }
    if (family === 6 && isPrivateV6(address)) {
      return { ok: false, reason: 'Hostname resolves to a private IPv6 address.' }
    }
  }

  return { ok: true, url }
}

/**
 * Convenience wrapper — throws if the URL isn't public. Use inside
 * server-only fetchers where a thrown error is easier to handle than
 * branching on a result type.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  const res = await isPublicUrl(rawUrl)
  if (!res.ok) throw new Error(`Blocked URL: ${res.reason}`)
  return res.url
}
