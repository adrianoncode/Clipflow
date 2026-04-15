-- ===========================================================================
-- Service-key BYOK extension
-- ===========================================================================
-- Clipflow's business model: we provide scrapers + creator database +
-- UX orchestration. Users bring their own keys for every paid external
-- service. This migration opens `public.ai_keys` to accept the three
-- media-stack providers we previously ate the cost of:
--
--   - Shotstack (video rendering)
--   - Replicate (avatars, reframe)
--   - ElevenLabs (TTS, voice clones, auto-dub)
--
-- Same encryption model (AES-256-GCM in ciphertext/iv/auth_tag).
-- Same RLS. Same uniqueness constraint. Just a broader provider enum.
-- ===========================================================================

alter table public.ai_keys
  drop constraint if exists ai_keys_provider_check;

alter table public.ai_keys
  add constraint ai_keys_provider_check
  check (
    provider in (
      'openai',
      'anthropic',
      'google',
      'shotstack',
      'replicate',
      'elevenlabs'
    )
  );
