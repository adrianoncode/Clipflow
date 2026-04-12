import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form-message'
import { OutputCard } from '@/components/outputs/output-card'
import type { OutputRow } from '@/lib/content/get-outputs'
import type { OutputPlatform } from '@/lib/supabase/types'

const PLATFORM_ORDER: readonly OutputPlatform[] = [
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
  'linkedin',
]

const PLATFORM_LABELS: Record<OutputPlatform, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Instagram Reels',
  youtube_shorts: 'YouTube Shorts',
  linkedin: 'LinkedIn',
}

interface OutputsGridProps {
  outputs: OutputRow[]
  contentId: string
  workspaceId?: string
  failed?: Array<{ platform: OutputPlatform; error: string }>
}

export function OutputsGrid({ outputs, contentId, workspaceId, failed = [] }: OutputsGridProps) {
  const byPlatform = new Map<OutputPlatform, OutputRow>()
  for (const output of outputs) {
    byPlatform.set(output.platform, output)
  }
  const failedByPlatform = new Map<OutputPlatform, string>()
  for (const entry of failed) {
    failedByPlatform.set(entry.platform, entry.error)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {PLATFORM_ORDER.map((platform) => {
        const output = byPlatform.get(platform)
        const failure = failedByPlatform.get(platform)
        if (output) {
          return <OutputCard key={platform} output={output} contentId={contentId} workspaceId={workspaceId} />
        }
        if (failure) {
          return (
            <Card key={platform} className="border-destructive/40">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">{PLATFORM_LABELS[platform]}</CardTitle>
                <CardDescription>Generation failed.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormMessage variant="error">{failure}</FormMessage>
              </CardContent>
            </Card>
          )
        }
        return (
          <Card key={platform} className="border-dashed">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{PLATFORM_LABELS[platform]}</CardTitle>
              <CardDescription>Not generated yet.</CardDescription>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
