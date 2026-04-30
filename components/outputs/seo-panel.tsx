'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Check, Copy, Search, Smile, Sparkles } from 'lucide-react'

import { getSeoSuggestionsAction } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/ai-actions'
import type { SeoResult } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/ai-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copyToClipboard } from '@/lib/utils/copy-to-clipboard'

interface SeoPanelProps {
  workspaceId: string
  contentId: string
  initialSeo: SeoResult | null
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} className="gap-1.5">
      <Search className="h-3.5 w-3.5" />
      {pending ? 'Analyzing…' : 'Get SEO suggestions'}
    </Button>
  )
}

export function SeoPanel({ workspaceId, contentId, initialSeo }: SeoPanelProps) {
  const [state, formAction] = useFormState(
    getSeoSuggestionsAction,
    {},
  )

  const seo: SeoResult | null = state.ok === true ? state.seo : initialSeo

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Search className="h-4 w-4 text-blue-500" />
          SEO Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Generate SEO keywords, a page title, and a search-result description for your content.
        </p>
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="content_id" value={contentId} />
          <SubmitBtn />
          {state.ok === false && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
          {state.ok === true && (
            <p className="text-xs text-emerald-600">SEO updated!</p>
          )}
        </form>

        {seo && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            {/* Primary keyword */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Primary Keyword
              </p>
              <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-sm font-semibold">
                {seo.primary_keyword}
              </span>
            </div>

            {/* Secondary keywords */}
            {seo.secondary_keywords?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Secondary Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {seo.secondary_keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SEO title */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                SEO Title
              </p>
              <p className="text-sm font-medium">{seo.seo_title}</p>
            </div>

            {/* Meta description */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Search Description
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{seo.meta_description}</p>
            </div>

            {/* Hashtag strategy */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Hashtag Strategy
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{seo.hashtag_strategy}</p>
            </div>

            {/* Per-platform hashtag sets — added in the hashtag UI pass.
                Each platform gets a collapsible-style block with a
                copy-all button so drafters can paste a whole set. */}
            {seo.hashtags ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Hashtags per platform
                </p>
                {(['tiktok', 'instagram', 'youtube', 'linkedin'] as const).map((p) => {
                  const tags = seo.hashtags?.[p] ?? []
                  if (tags.length === 0) return null
                  return <HashtagRow key={p} platform={p} tags={tags} />
                })}
              </div>
            ) : null}

            {/* Per-platform emoji suggestions — compact row, tappable
                to copy a single emoji to clipboard. */}
            {seo.emojis ? (
              <div className="space-y-2 pt-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Smile className="h-3 w-3" />
                  Emoji suggestions
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['tiktok', 'instagram', 'youtube', 'linkedin'] as const).map((p) => {
                    const emojis = seo.emojis?.[p] ?? []
                    if (emojis.length === 0) return null
                    return (
                      <div
                        key={p}
                        className="flex flex-col gap-1 rounded-lg border bg-background p-2"
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {p}
                        </span>
                        <div className="flex flex-wrap gap-0.5">
                          {emojis.map((e) => (
                            <EmojiChip key={e} emoji={e} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HashtagRow({ platform, tags }: { platform: string; tags: string[] }) {
  const [copied, setCopied] = useState(false)
  const joined = tags.map((t) => `#${t}`).join(' ')

  async function handleCopy() {
    const ok = await copyToClipboard(joined)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="rounded-lg border bg-background p-2.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {platform}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={`Copy ${platform} hashtags`}
        >
          {copied ? (
            <>
              <Check className="h-2.5 w-2.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-2.5 w-2.5" />
              Copy all
            </>
          )}
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function EmojiChip({ emoji }: { emoji: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyToClipboard(emoji)
        if (ok) {
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }
      }}
      title={copied ? 'Copied' : 'Click to copy'}
      className="flex h-8 w-8 items-center justify-center rounded-lg border text-[17px] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted"
      style={{ background: copied ? 'var(--lv2d-accent, #F4D93D)' : undefined }}
    >
      {emoji}
      <Sparkles className="sr-only h-3 w-3" />
    </button>
  )
}
