-- ============================================================================
--  Encrypt social_accounts OAuth tokens at rest (AES-256-GCM, base64 strings)
-- ============================================================================
--
--  WHY
--  ───
--  The original migration (`20260412000013_social_scheduler.sql`) shipped with
--  the placeholder column `access_token text not null` and a comment
--  ─ "encrypted in production, plaintext for MVP". A leak of this column (DB
--  dump, compromised SUPABASE_SERVICE_ROLE_KEY, future SQL-injection) would
--  hand every connected social account to the attacker.
--
--  At the time of writing, no application code path writes to this column —
--  the publish layer routes via Composio / Upload-Post / X (BYO API), none of
--  which use `social_accounts.*_token`. We harden the schema NOW so that when
--  the native-OAuth flow gets wired (via `lib/oauth/exchange-token.ts`), there
--  is no plaintext path to footgun the next engineer with.
--
--  WHAT
--  ────
--  1. Add three columns each for access + refresh tokens:
--       *_ciphertext text  — base64-encoded AES-256-GCM ciphertext
--       *_iv         text  — base64-encoded 12-byte IV
--       *_auth_tag   text  — base64-encoded 16-byte GCM auth tag
--     (Same shape as `ai_keys` post-`20260413000000_content_input.sql`.)
--
--  2. Defensive guard: abort if the table contains any row with a plaintext
--     `access_token`, since Postgres has no access to the master key and
--     can't auto-encrypt them. We expect zero rows; if non-zero, the
--     migration must be paired with an app-side backfill before re-running.
--
--  3. Drop the plaintext columns entirely.
--
--  4. Document via column comments that the new triple is the only legal
--     write path, enforced by `lib/social-tokens.ts`.
-- ============================================================================

-- 1. Defensive guard ─────────────────────────────────────────────────────────
-- Abort the migration if any plaintext token exists. This protects against
-- silent data loss when running on a future environment where someone wired
-- the OAuth flow before this hardening landed.
do $$
declare
  legacy_row_count int;
begin
  select count(*) into legacy_row_count
  from public.social_accounts
  where access_token is not null and access_token <> '';

  if legacy_row_count > 0 then
    raise exception
      'social_accounts has % row(s) with plaintext access_token. '
      'Migration aborted — back up rows, encrypt via lib/social-tokens.ts, '
      'and re-run after clearing the plaintext column.',
      legacy_row_count;
  end if;
end$$;

-- 2. Add encrypted columns ───────────────────────────────────────────────────
alter table public.social_accounts
  add column access_token_ciphertext text,
  add column access_token_iv         text,
  add column access_token_auth_tag   text,
  add column refresh_token_ciphertext text,
  add column refresh_token_iv         text,
  add column refresh_token_auth_tag   text;

-- 3. Drop plaintext columns ──────────────────────────────────────────────────
-- Both columns are confirmed unused by any application code path. Dropping
-- removes the footgun for future contributors.
alter table public.social_accounts
  drop column access_token,
  drop column refresh_token;

-- 4. Integrity invariant ─────────────────────────────────────────────────────
-- A row either has the full GCM triple (ciphertext + iv + auth_tag) or none
-- of them. Half-populated state means a write went wrong and decrypt would
-- fail anyway — fail loud at write-time instead.
alter table public.social_accounts
  add constraint social_accounts_access_token_triple_complete
    check (
      (access_token_ciphertext is null
        and access_token_iv is null
        and access_token_auth_tag is null)
      or
      (access_token_ciphertext is not null
        and access_token_iv is not null
        and access_token_auth_tag is not null)
    ),
  add constraint social_accounts_refresh_token_triple_complete
    check (
      (refresh_token_ciphertext is null
        and refresh_token_iv is null
        and refresh_token_auth_tag is null)
      or
      (refresh_token_ciphertext is not null
        and refresh_token_iv is not null
        and refresh_token_auth_tag is not null)
    );

-- 5. Documentation ───────────────────────────────────────────────────────────
comment on column public.social_accounts.access_token_ciphertext is
  'AES-256-GCM ciphertext (base64). Write only via lib/social-tokens.ts saveSocialTokens().';
comment on column public.social_accounts.access_token_iv is
  'AES-256-GCM IV (base64, 12 bytes). Random per write.';
comment on column public.social_accounts.access_token_auth_tag is
  'AES-256-GCM auth tag (base64, 16 bytes). Verified on decrypt; tamper-evident.';
comment on column public.social_accounts.refresh_token_ciphertext is
  'AES-256-GCM ciphertext for refresh token. Optional — null for platforms with non-refreshable access tokens.';
