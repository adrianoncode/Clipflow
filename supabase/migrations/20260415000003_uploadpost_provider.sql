-- Add upload-post as a valid BYOK provider in ai_keys.
-- Upload-Post handles social publishing (TikTok, Instagram, YouTube, LinkedIn)
-- via a single API key — users bring their own account.

ALTER TABLE ai_keys
  DROP CONSTRAINT IF EXISTS ai_keys_provider_check;

ALTER TABLE ai_keys
  ADD CONSTRAINT ai_keys_provider_check CHECK (
    provider IN (
      'openai',
      'anthropic',
      'google',
      'shotstack',
      'replicate',
      'elevenlabs',
      'upload-post'
    )
  );
