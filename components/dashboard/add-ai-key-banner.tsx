import Link from 'next/link'

import { Button } from '@/components/ui/button'

interface AddAiKeyBannerProps {
  workspaceName: string
}

/**
 * Shown on the dashboard when the current workspace has no AI keys yet.
 * Nudges the user toward /settings/ai-keys instead of blocking them —
 * matches the "Skip for now still marks onboarded" decision from M2's
 * scope discussion.
 */
export function AddAiKeyBanner({ workspaceName }: AddAiKeyBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="font-medium">Connect your AI (free)</p>
        <p className="text-sm text-muted-foreground">
          {workspaceName} needs an AI connection before Clipflow can generate drafts.
          OpenAI, Anthropic, and Google all offer free credits to get started.
        </p>
      </div>
      <Button asChild>
        <Link href="/settings/ai-keys">Connect AI</Link>
      </Button>
    </div>
  )
}
