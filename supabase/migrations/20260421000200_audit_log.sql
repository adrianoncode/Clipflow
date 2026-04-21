-- ===========================================================================
-- Audit log — who did what, when, in which workspace
-- ===========================================================================
-- Agencies running Clipflow for multiple clients need an answer to
-- "who approved this", "when was that member removed", "who rotated
-- the AI key last week?". This table is the single source of truth.
--
-- Design choices:
--   - One row per audited event. Cheap write, cheap append-only read.
--   - `actor_id` nullable because the user row may be deleted later —
--     `actor_email` gives us a stable display-only backup that survives
--     account deletion. GDPR note: email is still PII, but agency
--     audit trails explicitly consent to this on invite.
--   - `action` is free-form text (not an enum) so product code can
--     introduce new action types without a schema migration. The
--     downside is typos — mitigated by the `AUDIT_ACTIONS` constant
--     in lib/audit/actions.ts, which every writer uses.
--   - `target_type` + `target_id` are strings rather than FKs so we
--     can reference things that may later be hard-deleted (outputs,
--     members, scheduled_posts) without losing the audit trail.
--   - `metadata` jsonb for per-action context (e.g. old role + new role
--     on a role-change event, or platform on a publish event).
-- ===========================================================================

create table public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  actor_id      uuid references auth.users(id) on delete set null,
  /** Actor's email at the time of the event — survives account deletion. */
  actor_email   text,
  /** Canonical action string. See lib/audit/actions.ts for the list. */
  action        text not null,
  /** Optional subject of the action, e.g. 'member', 'workspace', 'output'. */
  target_type   text,
  target_id     text,
  /** Free-form extra context — e.g. {"old_role":"reviewer","new_role":"editor"}. */
  metadata      jsonb not null default '{}'::jsonb,
  /** Pulled from request headers on write so we can trace unusual access. */
  ip            text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

-- Workspace-scoped queries with newest first — matches the only read
-- pattern (the owner view page). Partial to active tables only would
-- be marginal; log stays relatively small per workspace.
create index audit_log_workspace_created_idx
  on public.audit_log (workspace_id, created_at desc);

-- For cross-workspace user audits ("who is this actor?") — useful
-- for incident response but not on the hot path.
create index audit_log_actor_idx
  on public.audit_log (actor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS — owners see everything in their workspace; nobody else reads,
-- nobody writes directly (the service role writes via the write helper).
-- ---------------------------------------------------------------------------
alter table public.audit_log enable row level security;

create policy "audit_log: select if owner"
  on public.audit_log for select
  to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'::public.workspace_role));

-- No insert/update/delete policies — only the server (service role)
-- may write, via lib/audit/write.ts. Users never mutate audit rows,
-- and the lack of an owner-delete policy is intentional: owners must
-- not be able to cover their own tracks.
