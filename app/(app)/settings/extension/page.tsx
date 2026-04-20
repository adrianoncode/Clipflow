import { CopyTokenButton } from '@/components/settings/copy-token-button'
import { createClient } from '@/lib/supabase/server'
import { PageHeading } from '@/components/workspace/page-heading'

export const metadata = {
  title: 'Browser Extension',
}

export default async function ExtensionPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const token = session?.access_token ?? null

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Settings · Extension"
        title="Browser extension."
        body="Install the Clipflow Chrome extension to save any webpage to your workspace in one click."
      />

      {/* Installation Steps */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Installation</h2>
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
            Click the Clipflow icon in your toolbar, paste the token below, and click{' '}
            <strong className="text-foreground">Save</strong>.
          </li>
        </ol>
      </div>

      {/* Token Section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Your extension token</h2>
        <p className="text-sm text-muted-foreground">
          Copy this token and paste it into the extension popup to authenticate.
        </p>

        {token ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
              <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-muted-foreground">
                {token}
              </code>
              <CopyTokenButton token={token} />
            </div>
            <p className="text-xs text-muted-foreground">
              Keep this token private. It grants access to your Clipflow workspaces. Tokens expire
              when your session ends — return here to get a fresh one if the extension stops working.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No active session. Please sign in to get your token.
          </div>
        )}
      </div>
    </div>
  )
}
