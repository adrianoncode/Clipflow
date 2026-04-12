import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, Globe, Rss, Video, Youtube } from 'lucide-react'

import { ContentStatusBadge } from '@/components/content/content-status-badge'
import { DeleteProjectButton } from '@/components/projects/delete-project-button'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getProject, getProjectContentItems } from '@/lib/projects/get-project'

export const dynamic = 'force-dynamic'

interface ProjectDetailPageProps {
  params: { id: string; projectId: string }
}

const KIND_ICON = {
  video: Video,
  youtube: Youtube,
  url: Globe,
  rss: Rss,
  text: FileText,
} as const

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours} h ago`
    const days = Math.round(hours / 24)
    if (days < 7) return `${days} d ago`
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [workspaces, project, items] = await Promise.all([
    getWorkspaces(),
    getProject(params.projectId, params.id),
    getProjectContentItems(params.projectId, params.id),
  ])

  if (!project) notFound()

  const workspace = workspaces.find((w) => w.id === params.id)
  const canEdit = workspace?.role === 'owner' || workspace?.role === 'editor'

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/workspace/${params.id}/projects`}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            ← All projects
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        {canEdit && (
          <DeleteProjectButton workspaceId={params.id} projectId={params.projectId} />
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Content ({items.length})
        </h2>
        {canEdit && (
          <Link
            href={`/workspace/${params.id}/content/new?project=${params.projectId}`}
            className="text-xs font-medium underline-offset-4 hover:underline"
          >
            + Add content
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No content in this project yet.{' '}
          {canEdit && (
            <Link
              href={`/workspace/${params.id}/content/new?project=${params.projectId}`}
              className="underline underline-offset-4"
            >
              Add content
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind] ?? FileText
            return (
              <li key={item.id}>
                <Link
                  href={`/workspace/${params.id}/content/${item.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title ?? 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(item.created_at)}</p>
                  </div>
                  <ContentStatusBadge status={item.status} />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
