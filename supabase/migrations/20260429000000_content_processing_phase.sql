-- ===========================================================================
-- content_items: processing phase + progress
-- ===========================================================================
-- The existing `status` column is too coarse for the Recent-Imports-Strip
-- on /workspace/[id]: while a video is `processing`, the user has no
-- visibility into whether Whisper is still detecting language, mid-
-- transcription, or finishing up indexing. The strip used to render a
-- single "Transcribing…" pill for the entire 30-180s window.
--
-- These two columns add a sub-state inside the existing status:
--   - processing_phase  text  optional phase tag (queued | uploading
--                                                 | detect | transcribe
--                                                 | index)
--   - processing_progress smallint  0-100 progress hint within the
--                                   current phase (upload byte %, etc.)
--
-- Both are NULL by default — they're advisory hints, not load-bearing.
-- The Whisper-pipeline writes them at known boundaries and the UI falls
-- back to the existing status text when they're absent (e.g. for legacy
-- rows or transcription paths that don't yet emit phases).
--
-- We deliberately don't add a CHECK constraint on phase values — phases
-- are a UX hint that should evolve without requiring a schema change
-- every time we add a new milestone (e.g. "uploading-to-r2",
-- "post-processing-srt"). The application layer validates allowed
-- values when reading, not at write-time.
-- ===========================================================================

alter table public.content_items
  add column if not exists processing_phase text,
  add column if not exists processing_progress smallint;

alter table public.content_items
  add constraint content_items_processing_progress_chk
    check (processing_progress is null or (processing_progress >= 0 and processing_progress <= 100));

comment on column public.content_items.processing_phase is
  'Sub-state inside status=uploading|processing. Free-form text, validated client-side. Reset to NULL when status flips to ready or failed.';

comment on column public.content_items.processing_progress is
  '0-100 progress hint within the current phase (e.g. upload byte percent). NULL when the phase has no measurable progress.';
