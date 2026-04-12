-- Feature 11: Custom AI Personas
-- Extends brand voice with full persona (name, backstory, expertise, writing style)

create table if not exists ai_personas (
  id          uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name        text not null,
  backstory   text not null default '',
  expertise_areas text[] not null default '{}',
  writing_quirks text not null default '',
  example_responses text not null default '',
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Only one active persona per workspace
create unique index if not exists ai_personas_active_uniq
  on ai_personas (workspace_id) where is_active = true;

create index if not exists ai_personas_workspace_idx on ai_personas (workspace_id);

-- RLS
alter table ai_personas enable row level security;

create policy "workspace members can read personas"
  on ai_personas for select
  using (workspace_id in (
    select wm.workspace_id from workspace_members wm where wm.user_id = auth.uid()
  ));

create policy "editors can insert personas"
  on ai_personas for insert
  with check (workspace_id in (
    select wm.workspace_id from workspace_members wm
    where wm.user_id = auth.uid() and wm.role in ('owner', 'editor')
  ));

create policy "editors can update personas"
  on ai_personas for update
  using (workspace_id in (
    select wm.workspace_id from workspace_members wm
    where wm.user_id = auth.uid() and wm.role in ('owner', 'editor')
  ));

create policy "editors can delete personas"
  on ai_personas for delete
  using (workspace_id in (
    select wm.workspace_id from workspace_members wm
    where wm.user_id = auth.uid() and wm.role in ('owner', 'editor')
  ));
