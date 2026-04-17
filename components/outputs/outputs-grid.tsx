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
import { OUTPUT_PLATFORMS, PLATFORM_LONG_LABELS as PLATFORM_LABELS } from '@/lib/platforms'

const PLATFORM_ORDER: readonly OutputPlatform[] = OUTPUT_PLATFORMS

interface OutputsGridProps {
  outputs: OutputRow[]
  contentId: string
  workspaceId?: string
  hasPublishKey?: boolean
  failed?: Array<{ platform: OutputPlatform; error: string }>
}

export function OutputsGrid({ outputs, contentId, workspaceId, hasPublishKey = false, failed = [] }: OutputsGridProps) {
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
          return <OutputCard key={platform} output={output} contentId={contentId} workspaceId={workspaceId} hasPublishKey={hasPublishKey} />
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
