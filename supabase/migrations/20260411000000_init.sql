-- ===========================================================================
-- Clipflow — Initial schema (Milestone 1)
-- ===========================================================================
-- This migration creates the complete M1-through-M6 data model in one pass so
-- that the multi-tenant security posture is correct from day one. Tables for
-- later milestones (content_items, outputs, output_states, brand_voices) are
-- created as empty shells with RLS already enabled.
--
-- Sections:
--   1. Extensions
--   2. Enums
--   3. Tables
--   4. Indexes
--   5. updated_at trigger
--   6. RLS helper functions (SECURITY DEFINER to break policy recursion)
--   7. Enable RLS + policies
--   8. Signup trigger (profiles + personal workspace)
--   9. Storage bucket + policies
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";


-- ---------------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------------
create type public.workspace_type as enum ('personal', 'team', 'client');
create type public.workspace_role as enum ('owner', 'editor', 'viewer', 'client');
create type public.content_kind   as enum ('video', 'text');
create type public.content_status as enum ('uploading', 'processing', 'ready', 'failed');
create type public.output_platform as enum (
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
  'linkedin'
);
create type public.output_state as enum ('draft', 'review', 'approved', 'exported');


-- ---------------------------------------------------------------------------
-- 3. Tables
-- ---------------------------------------------------------------------------

-- 3.1 profiles — 1:1 with auth.users
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       citext not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3.2 workspaces
create table public.workspaces (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null,
  type        public.workspace_type not null,
  owner_id    uuid not null references public.profiles(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint workspaces_owner_slug_unique unique (owner_id, slug)
);

-- 3.3 workspace_members
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         public.workspace_role not null,
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- 3.4 ai_keys — BYOK, AES-256-GCM ciphertext stored as bytea
create table public.ai_keys (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  provider      text not null check (provider in ('openai', 'anthropic', 'google')),
  label         text,
  ciphertext    bytea not null,
  iv            bytea not null,
  auth_tag      bytea not null,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  constraint ai_keys_workspace_provider_label_unique unique (workspace_id, provider, label)
);

-- 3.5 projects
create table public.projects (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3.6 brand_voices — shell for future use
create table public.brand_voices (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  guidelines    jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3.7 content_items — shell for M3
create table public.content_items (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  kind          public.content_kind not null,
  status        public.content_status not null default 'uploading',
  title         text,
  source_url    text,
  transcript    text,
  metadata      jsonb not null default '{}'::jsonb,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3.8 outputs — shell for M4
-- workspace_id is denormalized on purpose to keep RLS policies simple and fast
create table public.outputs (
  id            uuid primary key default uuid_generate_v4(),
  content_id    uuid not null references public.content_items(id) on delete cascade,
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  platform      public.output_platform not null,
  body          text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3.9 output_states — audit trail of state transitions (M5)
-- workspace_id denormalized for the same reason as outputs
create table public.output_states (
  id            uuid primary key default uuid_generate_v4(),
  output_id     uuid not null references public.outputs(id) on delete cascade,
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  state         public.output_state not null,
  changed_by    uuid references public.profiles(id),
  note          text,
  created_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
create index workspaces_owner_id_idx           on public.workspaces(owner_id);
create index workspace_members_user_id_idx     on public.workspace_members(user_id);
create index ai_keys_workspace_id_idx          on public.ai_keys(workspace_id);
create index projects_workspace_id_idx         on public.projects(workspace_id);
create index brand_voices_workspace_id_idx     on public.brand_voices(workspace_id);
create index content_items_workspace_id_idx    on public.content_items(workspace_id);
create index content_items_project_id_idx      on public.content_items(project_id);
create index content_items_created_at_idx      on public.content_items(workspace_id, created_at desc);
create index outputs_content_id_idx            on public.outputs(content_id);
create index outputs_workspace_id_idx          on public.outputs(workspace_id);
create index output_states_output_id_idx       on public.output_states(output_id);
create index output_states_workspace_id_idx    on public.output_states(workspace_id);


-- ---------------------------------------------------------------------------
-- 5. updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger brand_voices_set_updated_at
  before update on public.brand_voices
  for each row execute function public.set_updated_at();

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

create trigger outputs_set_updated_at
  before update on public.outputs
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 6. RLS helper functions (SECURITY DEFINER)
--
-- These functions run with the privileges of their owner (postgres) and thus
-- bypass RLS when they query workspace_members. This is how we avoid infinite
-- recursion when a policy on workspace_members needs to check membership.
--
-- search_path is pinned to `public, pg_temp` to defend against search path
-- hijack attacks from malicious extensions.
-- ---------------------------------------------------------------------------
create or replace function public.is_workspace_member(
  _workspace_id uuid,
  _role public.workspace_role default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = _workspace_id
      and wm.user_id      = auth.uid()
      and (_role is null or wm.role = _role)
  );
$$;

revoke all on function public.is_workspace_member(uuid, public.workspace_role) from public;
grant execute on function public.is_workspace_member(uuid, public.workspace_role) to authenticated;

create or replace function public.is_workspace_editor_or_above(_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = _workspace_id
      and wm.user_id      = auth.uid()
      and wm.role in ('owner', 'editor')
  );
$$;

revoke all on function public.is_workspace_editor_or_above(uuid) from public;
grant execute on function public.is_workspace_editor_or_above(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 7. Enable RLS + policies
-- ---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.workspaces         enable row level security;
alter table public.workspace_members  enable row level security;
alter table public.ai_keys            enable row level security;
alter table public.projects           enable row level security;
alter table public.brand_voices       enable row level security;
alter table public.content_items      enable row level security;
alter table public.outputs            enable row level security;
alter table public.output_states      enable row level security;


-- 7.1 profiles ---------------------------------------------------------------
create policy "profiles: select self or co-member"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.workspace_members mine
      join public.workspace_members theirs
        on theirs.workspace_id = mine.workspace_id
      where mine.user_id = auth.uid()
        and theirs.user_id = public.profiles.id
    )
  );

create policy "profiles: update self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Insert is handled by the signup trigger (SECURITY DEFINER). No insert policy.
-- Delete is handled by auth.users cascade. No delete policy.


-- 7.2 workspaces -------------------------------------------------------------
create policy "workspaces: select if member"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id));

create policy "workspaces: insert self-owned"
  on public.workspaces for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "workspaces: update if owner"
  on public.workspaces for update
  to authenticated
  using (public.is_workspace_member(id, 'owner'))
  with check (public.is_workspace_member(id, 'owner'));

create policy "workspaces: delete if owner"
  on public.workspaces for delete
  to authenticated
  using (public.is_workspace_member(id, 'owner'));


-- 7.3 workspace_members ------------------------------------------------------
create policy "workspace_members: select if member"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "workspace_members: insert if owner"
  on public.workspace_members for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id, 'owner'));

create policy "workspace_members: update if owner"
  on public.workspace_members for update
  to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'))
  with check (public.is_workspace_member(workspace_id, 'owner'));

create policy "workspace_members: delete if owner or self"
  on public.workspace_members for delete
  to authenticated
  using (
    public.is_workspace_member(workspace_id, 'owner')
    or user_id = auth.uid()
  );


-- 7.4 ai_keys — owner-only in M1 --------------------------------------------
create policy "ai_keys: select if owner"
  on public.ai_keys for select
  to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));

create policy "ai_keys: insert if owner"
  on public.ai_keys for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id, 'owner'));

create policy "ai_keys: update if owner"
  on public.ai_keys for update
  to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'))
  with check (public.is_workspace_member(workspace_id, 'owner'));

create policy "ai_keys: delete if owner"
  on public.ai_keys for delete
  to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));


-- 7.5 projects ---------------------------------------------------------------
create policy "projects: select if member"
  on public.projects for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "projects: insert if editor+"
  on public.projects for insert
  to authenticated
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "projects: update if editor+"
  on public.projects for update
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id))
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "projects: delete if editor+"
  on public.projects for delete
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id));


-- 7.6 brand_voices -----------------------------------------------------------
create policy "brand_voices: select if member"
  on public.brand_voices for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "brand_voices: insert if editor+"
  on public.brand_voices for insert
  to authenticated
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "brand_voices: update if editor+"
  on public.brand_voices for update
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id))
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "brand_voices: delete if editor+"
  on public.brand_voices for delete
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id));


-- 7.7 content_items ----------------------------------------------------------
create policy "content_items: select if member"
  on public.content_items for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "content_items: insert if editor+"
  on public.content_items for insert
  to authenticated
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "content_items: update if editor+"
  on public.content_items for update
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id))
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "content_items: delete if editor+"
  on public.content_items for delete
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id));


-- 7.8 outputs ----------------------------------------------------------------
create policy "outputs: select if member"
  on public.outputs for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "outputs: insert if editor+"
  on public.outputs for insert
  to authenticated
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "outputs: update if editor+"
  on public.outputs for update
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id))
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "outputs: delete if editor+"
  on public.outputs for delete
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id));


-- 7.9 output_states ----------------------------------------------------------
create policy "output_states: select if member"
  on public.output_states for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "output_states: insert if editor+"
  on public.output_states for insert
  to authenticated
  with check (public.is_workspace_editor_or_above(workspace_id));

-- output_states are immutable audit trail — no update/delete policies.


-- ---------------------------------------------------------------------------
-- 8. Signup trigger
--
-- Runs inside the auth signup transaction. If anything here throws, the
-- entire signup is rolled back. Keep it defensive: coalesce everything,
-- rely on idempotent inserts.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_workspace_id uuid;
  v_full_name    text := coalesce(new.raw_user_meta_data->>'full_name', null);
begin
  -- Idempotent profile insert (survives retried signups with same id)
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, v_full_name)
  on conflict (id) do nothing;

  -- Create the personal workspace
  insert into public.workspaces (name, slug, type, owner_id)
  values ('Personal', 'personal', 'personal', new.id)
  returning id into v_workspace_id;

  -- Register the user as owner
  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 9. Storage bucket + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('content', 'content', false)
on conflict (id) do nothing;

-- Uploads must start with the workspace id as the first path segment.
-- e.g. "<workspace_id>/videos/my-clip.mp4"
create policy "content: select if member"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'content'
    and (
      (storage.foldername(name))[1] is not null
      and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "content: insert if editor+"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'content'
    and (
      (storage.foldername(name))[1] is not null
      and public.is_workspace_editor_or_above(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "content: update if editor+"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'content'
    and (
      (storage.foldername(name))[1] is not null
      and public.is_workspace_editor_or_above(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "content: delete if editor+"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'content'
    and (
      (storage.foldername(name))[1] is not null
      and public.is_workspace_editor_or_above(((storage.foldername(name))[1])::uuid)
    )
  );
