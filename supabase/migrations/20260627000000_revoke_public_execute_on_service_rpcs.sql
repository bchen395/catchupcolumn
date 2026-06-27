-- Lock down service-role-only RPCs that were missing the PUBLIC revoke.
--
-- Postgres grants EXECUTE on every new function to PUBLIC by default. The
-- earlier email/compile migrations only added `grant ... to service_role`,
-- which does NOT remove that default PUBLIC grant. As a result these
-- SECURITY DEFINER functions were reachable by `anon` and `authenticated`
-- through PostgREST. Most seriously, `get_edition_email_payload` returns every
-- recipient's email address and unsubscribe_token (plus all post bodies) for
-- any edition id, bypassing RLS entirely.
--
-- The push-side migrations (20260501000000, 20260505000040) already revoke the
-- default PUBLIC grant; this migration applies the same treatment to the email
-- and compile functions, and drops the now-unused get_groups_to_compile.

-- Email delivery pipeline (service_role only).
revoke all on function public.get_edition_email_payload(uuid) from public, anon, authenticated;
revoke all on function public.mark_edition_emailed(uuid) from public, anon, authenticated;
revoke all on function public.increment_edition_email_attempts(uuid) from public, anon, authenticated;
revoke all on function public.claim_edition_for_email(uuid) from public, anon, authenticated;
revoke all on function public.release_edition_email_claim(uuid) from public, anon, authenticated;

-- Compilation entrypoint (invoked by the cron edge function as service_role).
revoke all on function public.compile_due_editions(int) from public, anon, authenticated;

-- Re-assert the intended grant. The revoke above does not touch service_role,
-- but keep these explicit so the privilege set is obvious from this file.
grant execute on function public.get_edition_email_payload(uuid) to service_role;
grant execute on function public.mark_edition_emailed(uuid) to service_role;
grant execute on function public.increment_edition_email_attempts(uuid) to service_role;
grant execute on function public.claim_edition_for_email(uuid) to service_role;
grant execute on function public.release_edition_email_claim(uuid) to service_role;
grant execute on function public.compile_due_editions(int) to service_role;

-- Dead code: superseded by compile_due_editions, referenced nowhere in the
-- edge functions or client. Drop it so it can't be called or drift.
drop function if exists public.get_groups_to_compile(int);
