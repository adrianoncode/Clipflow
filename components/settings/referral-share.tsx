'use client'

import { useState } from 'react'
import { Check, Copy, Share2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/utils/copy-to-clipboard'

interface ReferralShareProps {
  link: string
  code: string
}

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * Renders the user's referral link + code with copy-to-clipboard and a
 * native-share fallback. Shows an explicit "couldn't copy" hint on HTTP
 * or older browsers so the user knows what went wrong.
 */
export function ReferralShare({ link, code }: ReferralShareProps) {
  const [linkState, setLinkState] = useState<CopyState>('idle')
  const [codeState, setCodeState] = useState<CopyState>('idle')

  async function copy(value: string, which: 'link' | 'code') {
    const setter = which === 'link' ? setLinkState : setCodeState
    const ok = await copyToClipboard(value)
    setter(ok ? 'copied' : 'failed')
    setTimeout(() => setter('idle'), ok ? 1500 : 3000)
  }

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Clipflow',
          text: 'Turn one video into TikTok, Reels, Shorts and LinkedIn posts. Use my link for 20% off:',
          url: link,
        })
        return
      } catch {
        // User cancelled — fall through to clipboard.
      }
    }
    await copy(link, 'link')
  }

  const showFailure = linkState === 'failed' || codeState === 'failed'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-10 flex-1 items-center overflow-hidden rounded-md border bg-muted/40 px-3 text-sm">
          <span className="truncate">{link}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => copy(link, 'link')}
          className="shrink-0"
        >
          {linkState === 'copied' ? (
            <>
              <Check className="mr-1 h-4 w-4" /> Copied
            </>
          ) : linkState === 'failed' ? (
            <>
              <AlertCircle className="mr-1 h-4 w-4" /> Failed
            </>
          ) : (
            <>
              <Copy className="mr-1 h-4 w-4" /> Copy
            </>
          )}
        </Button>
        <Button type="button" size="sm" onClick={nativeShare} className="shrink-0">
          <Share2 className="mr-1 h-4 w-4" /> Share
        </Button>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Or share your code:</span>
        <button
          type="button"
          onClick={() => copy(code, 'code')}
          className="rounded-md border bg-background px-2 py-1 font-mono text-xs tracking-wider hover:bg-accent"
        >
          {codeState === 'copied' ? 'Copied!' : codeState === 'failed' ? 'Copy failed' : code}
        </button>
      </div>
      {showFailure ? (
        <p className="text-xs text-amber-600">
          Your browser blocked the clipboard. Select the link above manually (long-press on
          mobile, or Cmd/Ctrl+C after clicking inside the box).
        </p>
      ) : null}
    </div>
  )
}
