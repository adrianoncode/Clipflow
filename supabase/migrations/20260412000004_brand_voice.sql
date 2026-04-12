-- M10: Brand Voice per workspace
create table if not exists public.brand_voices (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null default 'Default',
  tone         text,          -- e.g. "casual, witty, direct"
  avoid        text,          -- e.g. "jargon, passive voice, emojis"
  example_hook text,          -- a sample hook that matches the brand voice
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index brand_voices_workspace_active_idx
  on public.brand_voices(workspace_id)
  where is_active = true;

alter table public.brand_voices enable row level security;

create policy "workspace members can read brand voice"
  on public.brand_voices for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = brand_voices.workspace_id
        and user_id = auth.uid()
    )
  );

create policy "editors can upsert brand voice"
  on public.brand_voices for all
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = brand_voices.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );
