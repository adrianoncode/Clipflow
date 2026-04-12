-- Feature 2: AI Voice Clones via ElevenLabs

create table if not exists voice_clones (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  name                text not null,
  elevenlabs_voice_id text not null,
  is_default          boolean not null default false,
  sample_url          text,
  created_by          uuid references profiles(id),
  created_at          timestamptz not null default now()
);

create unique index if not exists voice_clones_default_uniq
  on voice_clones (workspace_id) where is_default = true;

create index if not exists voice_clones_workspace_idx on voice_clones (workspace_id);

alter table voice_clones enable row level security;

create policy "workspace members can read voice clones"
  on voice_clones for select
  using (workspace_id in (
    select wm.workspace_id from workspace_members wm where wm.user_id = auth.uid()
  ));

create policy "editors can manage voice clones"
  on voice_clones for all
  using (workspace_id in (
    select wm.workspace_id from workspace_members wm
    where wm.user_id = auth.uid() and wm.role in ('owner', 'editor')
  ));
