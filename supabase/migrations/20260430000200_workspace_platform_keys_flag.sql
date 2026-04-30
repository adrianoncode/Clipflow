-- ============================================================================
--  Add workspaces.platform_keys_enabled flag
-- ============================================================================
--
--  WHY
--  ───
--  `lib/ai/get-service-key.ts` silently falls back to platform-owned env
--  keys (SHOTSTACK_API_KEY / REPLICATE_API_TOKEN / ELEVENLABS_API_KEY) for
--  workspaces that haven't connected their own. Documented as legacy
--  behavior, but uncapped: a freshly signed-up free-tier workspace can
--  drain platform credits unbounded with no audit trail.
--
--  WHAT
--  ────
--  Add `platform_keys_enabled boolean` defaulted to `false`. Existing
--  workspaces that need to keep using the fallback during the BYOK
--  transition can be flipped to `true` by a migration script or by
--  admin tooling. New workspaces start at `false` and must connect
--  their own keys.
--
--  Combined with the audit-log entry written from get-service-key.ts,
--  we now have visibility into every platform-key consumption event.
-- ============================================================================

alter table public.workspaces
  add column if not exists platform_keys_enabled boolean not null default false;

comment on column public.workspaces.platform_keys_enabled is
  'When true, allows lib/ai/get-service-key.ts to fall back to platform-owned env keys (Shotstack/Replicate/ElevenLabs) when this workspace has no BYOK connected. Default false — new workspaces must bring their own.';
