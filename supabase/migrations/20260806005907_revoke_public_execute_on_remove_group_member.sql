-- Drop the default PUBLIC execute grant on remove_group_member.
--
-- Same footgun 20260627000000 swept up: Postgres grants EXECUTE on every new
-- function to PUBLIC, and `grant ... to authenticated` does not remove it. The
-- previous migration added only the grant, so `anon` could reach the function
-- through PostgREST (verified against production — an unauthenticated call
-- returned the function's own `not_authenticated` error rather than a 404).
--
-- Not an authorization hole: the function's first guard rejects a null
-- auth.uid(), so an anonymous caller could never remove anyone. This just
-- closes needless surface and keeps the privilege set consistent with the rest
-- of the RPCs.
revoke all on function public.remove_group_member(uuid, uuid) from public, anon;

-- Re-assert the intended grant so the privilege set is obvious from this file.
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
