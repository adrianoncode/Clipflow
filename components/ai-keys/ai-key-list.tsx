import { Badge } from '@/components/ui/badge'
import { DeleteAiKeyButton } from '@/components/ai-keys/delete-ai-key-button'
import type { AiKeySummary } from '@/lib/ai/get-ai-keys'
import type { AiProvider } from '@/lib/ai/providers/types'

const PROVIDER_LABEL: Record<AiProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

interface AiKeyListProps {
  keys: AiKeySummary[]
  workspaceId: string
}

export function AiKeyList({ keys, workspaceId }: AiKeyListProps) {
  if (keys.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No AI keys yet. Add your first one to start generating drafts.
      </div>
    )
  }

  return (
    <ul className="divide-y rounded-md border">
      {keys.map((key) => {
        const label = key.label ?? PROVIDER_LABEL[key.provider]
        return (
          <li
            key={key.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Badge variant="secondary">{PROVIDER_LABEL[key.provider]}</Badge>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{label}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {key.masked_preview ?? '—'} · added {formatDate(key.created_at)}
                </div>
              </div>
            </div>
            <DeleteAiKeyButton
              keyId={key.id}
              workspaceId={workspaceId}
              label={label}
            />
          </li>
        )
      })}
    </ul>
  )
}
