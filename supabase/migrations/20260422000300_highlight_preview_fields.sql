-- ===========================================================================
-- Highlight preview + adjustment fields
-- ===========================================================================
-- Three new columns on content_highlights so users can:
--   1. Nudge the clip bounds before spending a render credit
--      (the raw start/end still matter — the editor just updates them)
--   2. Manually override horizontal crop framing for 9:16 output when
--      our center-crop isn't where the speaker sits (crop_x in -0.5..0.5
--      where 0 is centered, -0.5 is far-left, 0.5 is far-right)
--   3. Show a poster thumbnail on each card instead of loading the
--      video just to paint a still frame
--
-- crop_x is numeric(4,2) so the frontend can pass fractional offsets
-- and we don't lose precision on round-trips. Defaults to NULL which
-- means "use automatic center-crop".
-- ===========================================================================

alter table public.content_highlights
  add column if not exists crop_x numeric(4,2)
    check (crop_x is null or (crop_x >= -0.5 and crop_x <= 0.5));

alter table public.content_highlights
  add column if not exists thumbnail_url text;
