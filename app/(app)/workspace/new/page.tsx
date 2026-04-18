import Link from 'next/link'
import { NewWorkspaceForm } from '@/components/workspace/new-workspace-form'

export const metadata = { title: 'New workspace' }

interface NewWorkspacePageProps {
  searchParams: { as?: string }
}

/** Studio users reach this page via "Add client" CTAs. When the
 * `?as=client` hint is present we flip the copy to match — keeps the
 * agency mental model intact instead of making them translate
 * "workspace" back into "client" in their head. */
export default function NewWorkspacePage({ searchParams }: NewWorkspacePageProps) {
  const isClientContext = searchParams.as === 'client'

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {isClientContext ? 'Add a client' : 'New workspace'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isClientContext
            ? "Give your client their own workspace. Their brand voice, drafts, and schedule stay separate from everyone else's."
            : 'Create a separate space for a different brand, client, or project.'}
        </p>
      </div>
      <NewWorkspaceForm defaultTypeHint={isClientContext ? 'client' : undefined} />
    </div>
  )
}
