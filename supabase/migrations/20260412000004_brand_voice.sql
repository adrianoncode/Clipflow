-- M10: Brand Voice per workspace
-- Handles both fresh installs and existing brand_voices tables with old schema.

-- 1. Create table if it does not exist yet (fresh install path).
create table if not exists public.brand_voices (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null default 'Default',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. Drop obsolete columns that lived in the prototype schema (idempotent).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brand_voices' and column_name = 'description'
  ) then
    alter table public.brand_voices drop column description;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brand_voices' and column_name = 'guidelines'
  ) then
    alter table public.brand_voices drop column guidelines;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brand_voices' and column_name = 'created_by'
  ) then
    alter table public.brand_voices drop column created_by;
  end if;
end
$$;

-- 3. Add new columns (idempotent via ADD COLUMN IF NOT EXISTS).
alter table public.brand_voices
  add column if not exists tone         text,
  add column if not exists avoid        text,
  add column if not exists example_hook text,
  add column if not exists is_active    boolean not null default true;

-- 4. Unique partial index — one active voice per workspace.
create unique index if not exists brand_voices_workspace_active_idx
  on public.brand_voices(workspace_id)
  where is_active = true;

-- 5. RLS.
alter table public.brand_voices enable row level security;

drop policy if exists "workspace members can read brand voice" on public.brand_voices;
create policy "workspace members can read brand voice"
  on public.brand_voices for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = brand_voices.workspace_id
        and user_id = auth.uid()
    )
  );

drop policy if exists "editors can upsert brand voice" on public.brand_voices;
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
