-- Workspace invite links
create table if not exists public.workspace_invites (
  id           uuid primary key default gen_random_uuid(),
  token        text unique not null default encode(gen_random_bytes(24), 'base64url'),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_by   uuid not null references auth.users(id),
  email        text,           -- optional: pre-fill for the invitee
  role         public.workspace_role not null default 'editor',
  is_accepted  boolean not null default false,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  created_at   timestamptz not null default now()
);

create index workspace_invites_token_idx        on public.workspace_invites(token);
create index workspace_invites_workspace_id_idx on public.workspace_invites(workspace_id);

alter table public.workspace_invites enable row level security;

-- Owners can manage invites for their workspace
create policy "owners can manage invites"
  on public.workspace_invites for all
  using  (public.is_workspace_member(workspace_id, 'owner'))
  with check (public.is_workspace_member(workspace_id, 'owner'));
