create table if not exists webhooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  url text not null,
  events text[] not null default '{}', -- ['content.ready', 'output.generated', 'output.approved', 'post.published']
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  last_triggered_at timestamptz,
  last_status integer -- HTTP response code from last trigger
);

alter table webhooks enable row level security;

create policy "workspace owners can manage webhooks"
  on webhooks for all
  using (exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = webhooks.workspace_id
    and workspace_members.user_id = auth.uid()
    and workspace_members.role in ('owner', 'editor')
  ));
