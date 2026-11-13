-- ============================================================
-- 20261113191544_harden_direct_writes.sql
--
-- Database audit, 2026-11-13. Five direct-write paths the API still allowed,
-- plus two indexes. Every statement below closes a write no app build, edge
-- function or operator script makes; RPC names, arguments, return shapes and
-- error codes are unchanged.
--
--   1. editions: no direct INSERT. "Moderators can create editions" (from
--      001_initial_schema, recreated in 20260426000000) and Supabase's default
--      table INSERT grant were never removed; 20260505000050 revoked only
--      UPDATE and DELETE. Anyone can create a Group and so be a moderator,
--      and POST /rest/v1/editions with every column, the server-only delivery
--      columns included. The cron's email and push sweeps
--      (_shared/edition-dispatch.ts, dispatchPendingEmails/Pushes) take the
--      50 oldest unsent editions by published_at. Fifty rows with
--      published_at in 1970 and email_claim_at / push_claim_at far in the
--      future can never be claimed, never be marked sent, and so fill every
--      sweep: no Group's scheduled edition is emailed or pushed again. An
--      edition_number of 2147483647 also makes the next compile of that
--      Group overflow max()+1, which aborts compile_due_editions for every
--      Group due in that tick. Editions are written only by
--      compile_due_editions and publish_edition_now (SECURITY DEFINER, run as
--      the owner) and by the service role.
--   2. posts: a new post must be a draft (edition_id is null). The INSERT
--      policy never checked it, so a member could file a story straight into
--      a published edition of their Group, or set edition_id to another
--      Group's edition, which get_edition_email_payload (it selects by
--      edition_id alone) would mail to that Group if its email hadn't gone
--      out. 20260703000000 closed the same hole for UPDATE. createPost never
--      sends edition_id.
--   3. users: UPDATE narrowed to display_name, avatar_url, bio. The table
--      UPDATE grant let a person PATCH their own users.email, which is where
--      get_edition_email_payload sends the edition email. With a Group of
--      their own and publish-edition-now they could mail attacker-written
--      stories from our verified sender to any address, as often as they
--      liked, and spend the Resend quota that sign-in codes share.
--      updateCurrentUserProfile only ever sends those three columns.
--   4. avatars bucket: drop the two 2026-04 "group cover images" policies
--      that let any signed-in person insert or overwrite any object under
--      avatars/groups/ (no ownership test). Covers moved to the group-covers
--      bucket in 20260505000020; nothing uploads there now. Public reads of
--      old cover URLs are unaffected (the bucket's read policy stays).
--   5. groups: invite codes unique ignoring case. The join and both preview
--      RPCs match lower(invite_code) = lower(trim(code)) ... limit 1, but the
--      unique constraint is case-sensitive, and a moderator can PATCH their
--      own Group's invite_code. Someone who knows another Group's code (a
--      member, or a person removed from it) could give their own Group the
--      same code in capitals, and the join would then pick either Group. The
--      expression index is also what those three lookups need: today each one
--      reads every Group, and get_invite_preview is callable without a
--      session.
--   6. group_members: a moderator can't demote the Group's last moderator.
--      prevent_last_moderator_removal guards DELETE only. The role-only
--      UPDATE grant (20261101195502) still lets a sole moderator PATCH their
--      own row to contributor (the policy's WITH CHECK reads the statement's
--      snapshot, where they are still moderator) and then leave, which
--      leaves a Group nobody can moderate. The app never updates role; the
--      runbook's promotion and hand_over_groups only ever promote.
--   7. posts(author_id): an index for the cascade from users (account
--      deletion), and for per-author lookups in removal and the email
--      payload's hidden_author_ids.
-- ============================================================

-- ------------------------------------------------------------
-- 1. editions — written only by the compile/publish RPCs
-- ------------------------------------------------------------
drop policy if exists "Moderators can create editions" on public.editions;

-- SELECT stays (members read editions under "Members can read editions in
-- their groups"). service_role keeps Supabase's default grants.
revoke insert, update, delete, truncate, references, trigger
  on table public.editions from anon, authenticated;

-- ------------------------------------------------------------
-- 2. posts INSERT — drafts only
-- ------------------------------------------------------------
-- Latest definition: 20260426000000. Adds `edition_id is null`; the rest is
-- unchanged. compile_due_editions and publish_edition_now remain the only
-- writers of edition_id.
drop policy if exists "Members can create posts in their groups" on public.posts;

create policy "Members can create posts in their groups"
  on public.posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and edition_id is null
    and public.is_group_member(group_id, auth.uid())
  );

-- ------------------------------------------------------------
-- 3. users UPDATE — profile columns only
-- ------------------------------------------------------------
-- RLS can't pick columns, so the grant does, as 20260703000000 did for SELECT
-- on this table. "Users can update their own profile" is unchanged. INSERT is
-- left as it is: ensureUserProfile's insert ... on conflict do nothing needs
-- it, and handle_new_user has already written the row from auth.users by then.
revoke update on table public.users from anon, authenticated;
grant update (display_name, avatar_url, bio) on table public.users to authenticated;

-- ------------------------------------------------------------
-- 4. avatars/groups/ — no longer writable by everyone
-- ------------------------------------------------------------
drop policy if exists "Authenticated users can upload group cover images" on storage.objects;
drop policy if exists "Authenticated users can update group cover images" on storage.objects;

-- ------------------------------------------------------------
-- 5. groups.invite_code — unique ignoring case, and indexed for the lookups
-- ------------------------------------------------------------
-- Codes are generated as lowercase hex, so existing rows can only collide
-- here if someone has already done what this prevents. If they have, this
-- statement fails and the migration rolls back whole.
create unique index if not exists groups_invite_code_lower_key
  on public.groups (lower(invite_code));

-- ------------------------------------------------------------
-- 6. prevent_last_moderator_demotion
-- ------------------------------------------------------------
-- The UPDATE twin of check_last_moderator_removal (20260426000005), with the
-- same message and code. No app.deleting_group bypass: nothing demotes as part
-- of deleting a Group or a person.
create or replace function public.check_last_moderator_demotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_moderators int;
begin
  if old.role <> 'moderator' or new.role = 'moderator' then
    return new;
  end if;

  select count(*)
    into remaining_moderators
  from public.group_members
  where group_id = old.group_id
    and role = 'moderator'
    and user_id <> old.user_id;

  if remaining_moderators = 0 then
    raise exception
      'Cannot remove the last moderator of a group. Transfer moderator rights to another member first.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- A trigger function is never called directly; as with handle_user_deletion
-- (20261030172045), nobody needs EXECUTE for the trigger to fire.
revoke all on function public.check_last_moderator_demotion()
  from public, anon, authenticated, service_role;

drop trigger if exists prevent_last_moderator_demotion on public.group_members;
create trigger prevent_last_moderator_demotion
  before update of role on public.group_members
  for each row
  execute function public.check_last_moderator_demotion();

-- ------------------------------------------------------------
-- 7. posts(author_id)
-- ------------------------------------------------------------
create index if not exists idx_posts_author_id on public.posts (author_id);
