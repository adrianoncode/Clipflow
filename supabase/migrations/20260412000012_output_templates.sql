create table if not exists output_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  platform text not null, -- 'tiktok' | 'instagram_reels' | 'youtube_shorts' | 'linkedin' | 'custom'
  system_prompt text not null,
  structure_hint text, -- brief description of expected output structure
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table output_templates enable row level security;

create policy "workspace members can read templates"
  on output_templates for select
  using (
    exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = output_templates.workspace_id
      and workspace_members.user_id = auth.uid()
    )
  );

create policy "owners and editors can manage templates"
  on output_templates for all
  using (
    exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = output_templates.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.role in ('owner', 'editor')
    )
  );
