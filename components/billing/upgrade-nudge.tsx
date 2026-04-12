import Link from 'next/link'

import { FormMessage } from '@/components/ui/form-message'

interface UpgradeNudgeProps {
  workspaceId: string
  message: string
}

export function UpgradeNudge({ workspaceId, message }: UpgradeNudgeProps) {
  return (
    <FormMessage variant="error">
      {message}{' '}
      <Link
        href={`/billing?workspace_id=${workspaceId}&plan=solo`}
        className="underline underline-offset-2"
      >
        Upgrade now →
      </Link>
    </FormMessage>
  )
}
