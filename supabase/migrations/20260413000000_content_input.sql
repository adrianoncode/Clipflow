-- ===========================================================================
-- Clipflow — Content input (Milestone 3)
-- ===========================================================================
-- 1. Switches ai_keys.ciphertext / iv / auth_tag from bytea to text.
--    M2 wrote these as base64-encoded strings via PostgREST. Postgres
--    accepted them as bytea via the JSON wire format, but reads came back
--    as "\x<hex>" under the default bytea_output = hex, which doesn't
--    round-trip with the M1 decrypt() helper expecting base64. Converting
--    the columns to text makes the wire format stable, and the in-place
--    backfill encode(<col>, 'base64') re-encodes any existing rows from
--    raw bytes to the base64 strings the app layer expects.
--
-- 2. Widens ai_keys SELECT from owner-only to editor+ so team members can
--    trigger transcription without owner intervention. INSERT / UPDATE /
--    DELETE stay owner-only.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. bytea -> text with in-place base64 backfill
-- ---------------------------------------------------------------------------
alter table public.ai_keys
  alter column ciphertext type text using encode(ciphertext, 'base64'),
  alter column iv         type text using encode(iv, 'base64'),
  alter column auth_tag   type text using encode(auth_tag, 'base64');


-- ---------------------------------------------------------------------------
-- 2. Widen the SELECT policy (insert/update/delete stay owner-only)
-- ---------------------------------------------------------------------------
drop policy "ai_keys: select if owner" on public.ai_keys;

create policy "ai_keys: select if editor+"
  on public.ai_keys for select
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id));
