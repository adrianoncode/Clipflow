/**
 * Sanity-test the v3 Composio SDK flow:
 *   1. get-or-create managed auth config for a toolkit
 *   2. initiate a connection for a fake user (workspace) id
 *   3. print the redirect URL
 *
 * Usage: pnpm dlx tsx scripts/composio-try-connect.ts <toolkit>
 * Example: pnpm dlx tsx scripts/composio-try-connect.ts twitter
 */

import { Composio } from '@composio/core'
import { readFileSync } from 'fs'

try {
  const raw = readFileSync('.env.local', 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!m) continue
    const key = m[1]!
    if (!process.env[key]) process.env[key] = m[2]!
  }
} catch { /* ignore */ }

async function main() {
  const toolkit = (process.argv[2] ?? 'twitter').toLowerCase()
  const apiKey = process.env.COMPOSIO_API_KEY
  if (!apiKey) throw new Error('COMPOSIO_API_KEY missing')

  const client = new Composio({ apiKey })

  console.log(`\nToolkit: ${toolkit}\n`)

  console.log('1. Get-or-create auth config...')
  let authConfigId: string
  try {
    const list = await (client as any).authConfigs.list({ toolkit })
    const items = list?.items ?? list?.data ?? []
    if (items[0]?.id) {
      authConfigId = items[0].id
      console.log(`   reusing existing: ${authConfigId}`)
    } else {
      const created = await (client as any).authConfigs.create(toolkit, {
        type: 'use_composio_managed_auth',
        name: `${toolkit} via Clipflow`,
      })
      authConfigId = created?.id ?? created?.authConfig?.id
      console.log(`   created: ${authConfigId}`)
      console.log('   raw response:', JSON.stringify(created, null, 2).slice(0, 400))
    }
  } catch (err: any) {
    console.log('   FAILED creating/listing auth config:', err?.message)
    if (err?.response?.data) console.log('   data:', JSON.stringify(err.response.data))
    return
  }

  console.log('\n2. Initiate connection for user "diag-test"...')
  try {
    const conn = await (client as any).connectedAccounts.link(
      'diag-test',
      authConfigId,
      { callbackUrl: 'http://localhost:3000/api/integrations/callback' },
    )
    console.log('   redirectUrl:', conn?.redirectUrl)
    console.log('   connectionId:', conn?.id)
  } catch (err: any) {
    console.log('   FAILED initiating:', err?.message)
    if (err?.response?.data) console.log('   data:', JSON.stringify(err.response.data))
  }
  console.log()
}

main().catch((e) => { console.error(e); process.exit(1) })
