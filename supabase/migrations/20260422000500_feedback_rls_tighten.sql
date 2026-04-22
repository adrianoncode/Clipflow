-- ===========================================================================
-- Tighten user_feedback insert policy
-- ===========================================================================
-- The initial policy allowed `user_id IS NULL OR user_id = auth.uid()`,
-- which combined with /api/feedback bypassing RLS via admin-client let any
-- authenticated (or anonymous) caller spray infinite rows.
--
-- New rule:
--   - authenticated users must write rows WITH their own user_id
--   - anonymous submissions stay blocked at the DB layer; if we ever
--     want to support signed-out feedback, add a separate policy with
--     its own rate-limit + CAPTCHA path instead of loosening this one
--
-- The route now uses the user-scoped client, so this RLS check is the
-- authoritative identity enforcement.
-- ===========================================================================

drop policy if exists "user_feedback: insert own" on public.user_feedback;

create policy "user_feedback: insert own"
  on public.user_feedback for insert
  to authenticated
  with check (user_id = auth.uid());
