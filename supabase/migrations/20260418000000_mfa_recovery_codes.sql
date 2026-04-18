-- ===========================================================================
-- MFA recovery codes
-- ===========================================================================
-- Supabase's built-in MFA only supports TOTP factors — if a user loses
-- their authenticator device (phone stolen / app cleared), there's no
-- self-serve recovery path without this table.
--
-- We generate 10 single-use codes on successful TOTP enrollment, show
-- them to the user ONCE (must be saved somewhere safe), and hash them
-- before storage. Each code is consumed on use.
--
-- Codes are hashed with SHA-256 — not bcrypt — because they're already
-- high-entropy random strings (96 bits), not user-chosen passwords.
-- Rainbow-table resistance is irrelevant; constant-time comparison on
-- verify is what matters.
-- ===========================================================================

create table public.mfa_recovery_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code_hash   text not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now(),
  -- Same hash never stored twice for the same user (paranoia guard).
  constraint mfa_recovery_codes_user_hash_unique unique (user_id, code_hash)
);

create index mfa_recovery_codes_user_id_idx
  on public.mfa_recovery_codes(user_id);

-- Partial index for the hot-path "count unused codes" query.
create index mfa_recovery_codes_user_unused_idx
  on public.mfa_recovery_codes(user_id)
  where used_at is null;

alter table public.mfa_recovery_codes enable row level security;

-- Users can only see their own codes. They can never read `code_hash`
-- anyway (we never expose it from any endpoint), but RLS scopes the
-- count/list queries correctly.
create policy "mfa_recovery_codes: select own"
  on public.mfa_recovery_codes for select
  to authenticated
  using (user_id = auth.uid());

-- Only server code using the service role writes to this table —
-- no authenticated insert/update/delete policies. RLS + no policy
-- = default deny for the anon + authenticated roles.
