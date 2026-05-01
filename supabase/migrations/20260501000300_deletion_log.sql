-- ============================================================================
--  deletion_log — survives the entity it records.
-- ============================================================================
--
--  Why a dedicated table instead of `audit_log`? Because `audit_log`
--  has `workspace_id REFERENCES workspaces(id) ON DELETE CASCADE` —
--  the second a workspace is deleted, every audit_log row that
--  recorded the path leading up to that delete is wiped with it.
--
--  This table is owned by the actor (a user) and keyed only loosely
--  to the deleted entity by id + a frozen label, so the trail
--  outlives the row it describes.
-- ============================================================================

create table if not exists public.deletion_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  actor_email text,
  kind        text not null,           -- 'workspace' | 'account' | future expansion
  target_id   text not null,           -- frozen string of the gone-row's id
  target_label text not null,          -- frozen human label (workspace name, etc.)
  metadata    jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

create index if not exists deletion_log_actor_id_idx on public.deletion_log (actor_id);
create index if not exists deletion_log_kind_idx     on public.deletion_log (kind);
create index if not exists deletion_log_occurred_at_idx
  on public.deletion_log (occurred_at desc);

-- RLS: actors can read their own deletion log entries. Service role
-- writes; users never insert directly.
alter table public.deletion_log enable row level security;

create policy "actor reads own deletion log"
  on public.deletion_log for select
  using (actor_id = auth.uid());

comment on table public.deletion_log is
  'Append-only record of destructive actions whose audit_log rows would be cascade-deleted along with the entity (e.g. workspace delete cascades audit_log rows). Service-role only on write.';
