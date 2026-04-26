import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, FolderKanban, Users2 } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import {
  SettingsRow,
  SettingsSection,
} from '@/components/settings/section'
import {
  WorkspaceDeleteButton,
  WorkspaceNameRow,
  WorkspaceTypeRow,
} from '@/components/settings/workspace-rows'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Workspace settings' }

export default async function WorkspaceSettingsPage({
  searchParams,
}: {
  searchParams: { workspace?: string }
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspaces()
  const workspaceId = searchParams.workspace ?? workspaces.find((w) => w.role === 'owner')?.id

  if (!workspaceId) redirect('/dashboard')

  const workspace = workspaces.find((w) => w.id === workspaceId)
  if (!workspace) redirect('/dashboard')

  const isOwner = workspace.role === 'owner'

  return (
    <div className="space-y-7">
      {/* ── 01 · Identity ──────────────────────────────────────── */}
      <SettingsSection title="Identity" hint="how this workspace shows up">
        <SettingsRow
          label="Name"
          description="The display name on the sidebar switcher and review links."
          control={<WorkspaceNameRow workspace={workspace} isOwner={isOwner} />}
          align="top"
        />
        <SettingsRow
          label="Type"
          description="Cosmetic — drives the label in the workspace header."
          control={<WorkspaceTypeRow workspace={workspace} isOwner={isOwner} />}
          align="top"
        />
      </SettingsSection>

      {/* ── 02 · Quick links ──────────────────────────────────── */}
      <SettingsSection title="Members & projects" hint="open in the workspace shell">
        <SettingsRow
          label="Team"
          description="Invite people, set roles, manage access."
          control={
            <Link
              href={`/workspace/${workspaceId}/members`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-[12px] font-bold text-foreground transition-all hover:-translate-y-px hover:border-border hover:shadow-sm"
            >
              <Users2 className="h-3.5 w-3.5" />
              Open team
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
        <SettingsRow
          label="Projects"
          description="Group content by campaign or client engagement."
          control={
            <Link
              href={`/workspace/${workspaceId}/projects`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-[12px] font-bold text-foreground transition-all hover:-translate-y-px hover:border-border hover:shadow-sm"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              Open projects
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
      </SettingsSection>

      {/* ── 03 · Danger zone ──────────────────────────────────── */}
      <SettingsSection title="Danger zone" hint="permanent · cannot be undone">
        <SettingsRow
          label="Delete workspace"
          description={
            <span>
              Permanently deletes every content item, draft, render, project, and
              integration in this workspace. <span className="font-bold text-foreground">Cannot be undone.</span>
            </span>
          }
          control={<WorkspaceDeleteButton workspace={workspace} isOwner={isOwner} />}
        />
      </SettingsSection>
    </div>
  )
}
