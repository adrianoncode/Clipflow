'use client'

import { useState } from 'react'
import { Check, MessageSquare, Linkedin, Twitter, Mail, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/utils/copy-to-clipboard'

interface Template {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  text: (link: string) => string
  /**
   * Appended to the referral URL as `?ref=CODE&source=<src>` so we can
   * attribute conversions back to the channel the user clicked from.
   */
  source: string
}

const TEMPLATES: Template[] = [
  {
    id: 'dm',
    label: 'Copy for DM',
    icon: MessageSquare,
    source: 'dm',
    text: (link) =>
      `Hey — nutze grad Clipflow. Macht aus einem Video automatisch Content für TikTok, Reels, Shorts & LinkedIn. Spart mir Stunden. Über meinen Link kriegst du 20 % off: ${link}`,
  },
  {
    id: 'twitter',
    label: 'Copy for Twitter',
    icon: Twitter,
    source: 'twitter',
    text: (link) =>
      `I've been using Clipflow to turn one video into TikTok, Reels, Shorts & LinkedIn posts — AI does the platform-specific rewrites automatically.\n\n20% off with my link: ${link}`,
  },
  {
    id: 'linkedin',
    label: 'Copy for LinkedIn',
    icon: Linkedin,
    source: 'linkedin',
    text: (link) =>
      `Stopped copy-pasting between ChatGPT tabs to repurpose my video content. Clipflow does it end-to-end — one upload, outputs optimized for TikTok, Reels, Shorts and LinkedIn.\n\nIf you're producing content across platforms, this is a real productivity lift. 20 % off via my referral: ${link}`,
  },
  {
    id: 'email',
    label: 'Copy for Email',
    icon: Mail,
    source: 'email',
    text: (link) =>
      `Hi,\n\nThought of you — I've been using Clipflow to repurpose long-form video into platform-native posts (TikTok, Reels, Shorts, LinkedIn). Saves me a few hours every week.\n\nIf you want to try it, you get 20% off through my link:\n${link}\n\nCheers`,
  },
]

interface ReferralShareTemplatesProps {
  link: string
}

/**
 * Pre-written share snippets to reduce the "blank page" friction that
 * stops most users from actually sending their referral. Each button
 * copies to clipboard AND tags the link with a `source=` param so we
 * can attribute paid conversions back to the channel that worked.
 */
export function ReferralShareTemplates({ link }: ReferralShareTemplatesProps) {
  const [stateById, setStateById] = useState<Record<string, 'copied' | 'failed' | undefined>>({})

  async function copy(tpl: Template) {
    const tagged = addSource(link, tpl.source)
    const ok = await copyToClipboard(tpl.text(tagged))
    setStateById((prev) => ({ ...prev, [tpl.id]: ok ? 'copied' : 'failed' }))
    setTimeout(
      () => setStateById((prev) => ({ ...prev, [tpl.id]: undefined })),
      ok ? 1500 : 3000,
    )
  }

  const anyFailed = Object.values(stateById).some((s) => s === 'failed')

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {TEMPLATES.map((tpl) => {
          const s = stateById[tpl.id]
          const Icon = tpl.icon
          return (
            <Button
              key={tpl.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copy(tpl)}
              className="justify-start"
            >
              {s === 'copied' ? (
                <Check className="mr-2 h-4 w-4 text-primary" />
              ) : s === 'failed' ? (
                <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
              ) : (
                <Icon className="mr-2 h-4 w-4" />
              )}
              {s === 'copied' ? 'Copied!' : s === 'failed' ? 'Copy failed' : tpl.label}
            </Button>
          )
        })}
      </div>
      {anyFailed ? (
        <p className="text-xs text-amber-600">
          Clipboard blocked by your browser — open this page on HTTPS or try a different
          browser.
        </p>
      ) : null}
    </div>
  )
}

function addSource(link: string, source: string): string {
  // Use URL to avoid breaking existing query strings.
  try {
    const url = new URL(link)
    url.searchParams.set('source', source)
    return url.toString()
  } catch {
    // link may be relative in tests — just append.
    return link.includes('?') ? `${link}&source=${source}` : `${link}?source=${source}`
  }
}
