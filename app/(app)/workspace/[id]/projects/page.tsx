import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CreateProjectForm } from '@/components/projects/create-project-form'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getProjects } from '@/lib/projects/get-projects'

export const dynamic = 'force-dynamic'

interface ProjectsPageProps {
  params: { id: string }
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  const projects = await getProjects(params.id)
  const canCreate = workspace.role === 'owner' || workspace.role === 'editor'

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Group content into campaigns or client projects.
        </p>
      </div>

      {canCreate && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">New project</h2>
          <CreateProjectForm workspaceId={params.id} />
        </div>
      )}

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet. Create one above.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/workspace/${params.id}/projects/${project.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  {project.description && (
                    <p className="truncate text-xs text-muted-foreground">{project.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {project.content_count} item{project.content_count === 1 ? '' : 's'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
