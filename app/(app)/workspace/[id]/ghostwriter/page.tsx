import Link from 'next/link'
import { GhostwriterForm } from '@/components/workspace/ghostwriter-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ghostwriter' }

interface GhostwriterPageProps {
  params: { id: string }
}

export default function GhostwriterPage({ params }: GhostwriterPageProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href={`/workspace/${params.id}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to workspace
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">AI Ghostwriter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your content idea and we&apos;ll write the script + platform drafts
        </p>
      </div>
      <GhostwriterForm workspaceId={params.id} />
    </div>
  )
}
