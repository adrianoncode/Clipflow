/**
 * Diagnose which Composio apps are actually ready to connect for
 * Clipflow's use case (social publishing + workflow integrations).
 *
 * Run: pnpm tsx scripts/composio-check.ts
 */

import { Composio } from 'composio-core'
import { readFileSync } from 'fs'

// Quick local .env.local loader (avoids a dotenv dep just for this script).
try {
  const raw = readFileSync('.env.local', 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!m) continue
    const key = m[1]!
    if (!process.env[key]) process.env[key] = m[2]!
  }
} catch { /* ignore */ }

const WANT = [
  // Already wired in code
  'NOTION', 'GOOGLEDRIVE', 'GOOGLESHEETS', 'LINKEDIN',
  // Socials we want to add
  'TWITTER', 'X', 'YOUTUBE', 'INSTAGRAM', 'THREADS', 'FACEBOOK',
  // Input/workflow roadmap
  'ZOOM', 'SLACK', 'GMAIL',
]

async function main() {
  const apiKey = process.env.COMPOSIO_API_KEY
  if (!apiKey) throw new Error('COMPOSIO_API_KEY missing in .env.local')
  const client = new Composio({ apiKey })

  console.log('\n=== Composio check for Clipflow ===\n')

  // List all apps Composio supports, filter to what we care about
  const apps = await client.apps.list()
  const byKey = new Map<string, any>(
    apps.map((a: any) => [String(a.key ?? a.name ?? '').toUpperCase(), a]),
  )

  console.log('Target apps:')
  for (const want of WANT) {
    const hit = byKey.get(want)
    if (!hit) {
      console.log(`  ✗ ${want.padEnd(14)} NOT FOUND in Composio catalog`)
      continue
    }
    const authModes = hit.auth_schemes?.map((s: any) => s.auth_mode).join(', ') ?? 'n/a'
    console.log(`  ✓ ${want.padEnd(14)} available · auth: ${authModes}`)
  }

  // Active integrations (auth configs) already set up in this project
  try {
    const integrations = await (client as any).integrations?.list?.()
    console.log('\nExisting auth configs in your project:')
    if (!integrations || integrations.length === 0) {
      console.log('  (none — default OAuth will be used per app)')
    } else {
      for (const i of integrations) {
        console.log(`  - ${i.appName ?? i.name} [id: ${i.id}]`)
      }
    }
  } catch (err) {
    console.log('\n(integrations.list not available in this SDK version)')
  }

  // Active connections (what any entity has connected)
  try {
    const entity = client.getEntity('default')
    const conns = await entity.getConnections()
    console.log(`\nConnections for 'default' entity: ${conns?.length ?? 0}`)
  } catch {
    /* ignore */
  }

  console.log('\nDone.\n')
}

main().catch((e) => {
  console.error('ERROR:', e.message ?? e)
  process.exit(1)
})
