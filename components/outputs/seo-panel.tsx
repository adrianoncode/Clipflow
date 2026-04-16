'use client'

import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { Search } from 'lucide-react'

import { getSeoSuggestionsAction } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { SeoResult } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
          Generate SEO-optimized keywords, title, and meta description for your content.
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
                Meta Description
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
