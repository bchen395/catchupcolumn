-- ============================================================
-- 20260703000000_security_hardening.sql
-- Pre-launch RLS + privilege hardening. Three independent fixes:
--   1. posts UPDATE: close cross-group / cross-edition injection.
--   2. users: stop leaking every user's email to all authenticated users.
--   3. group_members: stop leaking unsubscribe_token to co-members.
--   4. prepare_account_deletion: service_role only (route via edge fn).
-- ============================================================

-- --------------------------------------------------------
-- 1. posts UPDATE — cross-group / cross-edition injection
-- --------------------------------------------------------
-- The original policy (001_initial_schema.sql) only re-asserted
-- `author_id = auth.uid()` in WITH CHECK. It never validated the *new*
-- group_id or edition_id, so a post's author could PATCH group_id to a
-- group they don't belong to (the post then gets compiled into that
-- group's edition and emailed/pushed to its members), or set edition_id
-- to inject content into an existing edition.
--
-- Fix: an authenticated user may only update their own *draft* posts
-- (edition_id IS NULL — not yet compiled), the post must stay in a group
-- they belong to, and it must stay a draft. The compiler/publish RPCs run
-- as the table owner (SECURITY DEFINER) and bypass RLS, so they are
-- unaffected — they remain the only writers that set edition_id.
drop policy if exists "Users can update their own posts" on public.posts;

create policy "Users can update their own posts"
  on public.posts for update
  to authenticated
  using (
    author_id = auth.uid()
    and edition_id is null
  )
  with check (
    author_id = auth.uid()
    and edition_id is null
    and public.is_group_member(group_id, auth.uid())
  );

-- --------------------------------------------------------
-- 2. users.email — restrict to column privileges
-- --------------------------------------------------------
-- The SELECT policy is `using (true)` so any authenticated user could
-- `select email from users` and harvest every address. RLS can't scope by
-- column, so drop the table-wide SELECT grant and re-grant only the
-- non-sensitive profile columns. The client never reads users.email from
-- this table (its own email comes from the auth session); bylines/member
-- lists only need display_name/avatar_url/bio. service_role keeps full
-- access (email delivery RPCs run as the definer/owner, not via this grant).
revoke select on public.users from anon, authenticated;
grant select (id, display_name, avatar_url, bio, created_at)
  on public.users to authenticated;

-- --------------------------------------------------------
-- 3. group_members.unsubscribe_token — hide from co-members
-- --------------------------------------------------------
-- The SELECT policy returns whole rows to co-members, exposing each
-- member's unsubscribe_token — the sole secret in unsubscribe links, so a
-- co-member could unsubscribe another. Same treatment: grant every column
-- except unsubscribe_token. The unsubscribe endpoint and email RPCs read
-- the token via service_role, which is unaffected.
revoke select on public.group_members from anon, authenticated;
grant select (group_id, user_id, role, email_subscribed, push_subscribed, joined_at)
  on public.group_members to authenticated;

-- --------------------------------------------------------
-- 4. prepare_account_deletion — service_role only
-- --------------------------------------------------------
-- Granted to `authenticated` in 20260505000010 / 20260506000000. Its guard
-- makes it self-only, but a client could still call it directly and tear
-- down its memberships/groups/storage without the delete-account edge
-- function ever deleting the auth user — leaving a half-deleted account.
-- Deletion always flows through the edge function (service_role), so the
-- authenticated grant is unnecessary surface.
revoke execute on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
