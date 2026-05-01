-- ============================================================================
--  extension_tokens — separate revokable tokens for the browser extension
-- ============================================================================
--
--  WHY
--  ───
--  Before this migration, the Settings → Extension page rendered the user's
--  live `session.access_token` (Supabase JWT) directly into the HTML.
--  Anyone with view-source access — browser extensions reading the DOM, an
--  accidental screenshare, Sentry session-replay, server-side log collector
--  — could lift the JWT and impersonate the user across every workspace
--  they belonged to until the session refreshed.
--
--  Replace with a per-user, name-able, hashed, revokable token. The
--  plaintext is shown to the user exactly once at creation time; the
--  table only ever stores `sha256(plaintext)`. /api/extension/auth and
--  /api/extension/save-url verify by hashing the inbound bearer token
--  and looking up the row.
--
--  WHAT
--  ────
--  - One row per extension installation. Users can have multiple
--    (browser × machine combinations) so revoking one doesn't kill all.
--  - `token_hash` is sha256 hex of the random 32-byte plaintext.
--  - `revoked_at` is null while active; setting it disables verify
--    without deleting the audit trail.
--  - `last_used_at` lets users see "this token was used 2 minutes ago"
--    so revoke decisions are informed.
-- ============================================================================

create table if not exists public.extension_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  token_hash   text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

-- Lookup by hash on every authenticated extension request — needs a
-- B-tree on token_hash. The unique constraint above already creates one.

-- A user typically has 1–3 active tokens; index user_id for fast list.
create index if not exists extension_tokens_user_id_idx
  on public.extension_tokens (user_id)
  where revoked_at is null;

-- RLS: a user can see, create, and revoke their own tokens.
alter table public.extension_tokens enable row level security;

create policy "owner can read own extension tokens"
  on public.extension_tokens for select
  using (user_id = auth.uid());

create policy "owner can insert own extension tokens"
  on public.extension_tokens for insert
  with check (user_id = auth.uid());

create policy "owner can update own extension tokens"
  on public.extension_tokens for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No DELETE policy — soft-revoke only. Hard delete would lose the audit
-- trail of "this token used to exist on date X".

comment on table public.extension_tokens is
  'Per-installation tokens for the browser extension. Plaintext is shown to the user exactly once at creation; only sha256(token) is stored.';
comment on column public.extension_tokens.token_hash is
  'Hex sha256 of the plaintext token. Verifier hashes the inbound bearer and selects on this column.';
comment on column public.extension_tokens.revoked_at is
  'Soft-revoke. Verifier rejects rows where this is non-null.';
