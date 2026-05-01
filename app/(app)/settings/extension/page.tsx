import { redirect } from 'next/navigation'
import { Puzzle } from 'lucide-react'

import { ExtensionTokensClient } from './extension-tokens-client'
import { getUser } from '@/lib/auth/get-user'
import { listExtensionTokens } from '@/lib/extension-tokens'
import { SettingsHero } from '@/components/settings/settings-hero'
import { SettingsSection } from '@/components/settings/section'

export const metadata = {
  title: 'Browser Extension',
}

export default async function ExtensionPage() {
  const user = await getUser()
  if (!user) redirect('/login?next=/settings/extension')

  // Fetch only metadata (id, name, dates) — never the plaintext, which
  // is one-way-hashed at write time and not recoverable.
  const tokens = await listExtensionTokens(user.id)

  return (
    <div className="space-y-9">
      <SettingsHero
        monogram="EX"
        eyebrow="Account · Extension"
        title="Browser extension."
        body="Install the Clipflow Chrome extension to save any webpage to your workspace in one click."
        meta={
          <>
            <Puzzle className="h-3 w-3 text-muted-foreground/60" />
            chrome.google.com — soon
          </>
        }
      />

      <SettingsSection
        index="01"
        title="Installation"
        icon={<Puzzle className="h-3.5 w-3.5" />}
        hint="five steps · once per browser"
      >
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              1
            </span>
            Download the extension from the{' '}
            <a
              href="https://github.com"
              className="text-foreground underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub releases
            </a>{' '}
            page and unzip it.
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              2
            </span>
            Open Chrome and go to{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              chrome://extensions
            </code>
            .
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              3
            </span>
            Enable <strong className="text-foreground">Developer mode</strong> using the toggle in
            the top-right corner.
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              4
            </span>
            Click <strong className="text-foreground">Load unpacked</strong> and select the
            unzipped extension folder.
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              5
            </span>
            Create a token below, copy it once, paste it into the extension popup, click{' '}
            <strong className="text-foreground">Save</strong>.
          </li>
        </ol>
      </SettingsSection>

      <SettingsSection
        index="02"
        title="Tokens"
        icon={<Puzzle className="h-3.5 w-3.5" />}
        hint="one per browser/machine · revokable"
      >
        <ExtensionTokensClient tokens={tokens} />
        <p className="mt-4 text-xs text-muted-foreground">
          Extension tokens are revokable and scoped to your account. The plaintext
          appears once at creation — if you lose one, revoke it and create a new one.
        </p>
      </SettingsSection>
    </div>
  )
}
