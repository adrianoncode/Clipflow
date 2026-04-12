import Link from 'next/link'
import { NewWorkspaceForm } from '@/components/workspace/new-workspace-form'

export const metadata = { title: 'New workspace' }

export default function NewWorkspacePage() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New workspace</h1>
        <p className="text-sm text-muted-foreground">
          Create a separate space for a different brand, client, or project.
        </p>
      </div>
      <NewWorkspaceForm />
    </div>
  )
}
