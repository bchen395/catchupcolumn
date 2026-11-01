-- ============================================================
-- 20261101195755_take_down_post.sql
--
-- Take down one story (App Store Guideline 1.2, decided 2026-10-30), and stop
-- a removed creator reading the Group they were removed from.
--
-- Until now nothing could take a story out of a published edition. Removing
-- the writer (remove_group_member) deletes only their drafts, and the posts
-- DELETE policy is the author's own. Apple expects the people who run a space
-- to be able to remove objectionable content in it, so:
--
--   1. operator_take_down_post — deletes one post and every file in its
--      photo folder, published or not. service_role only: it is also the
--      operator's tool for acting on a report (docs/MODERATION.md), so it
--      trusts its caller.
--   2. take_down_post — the moderator's RPC. Checks the caller moderates the
--      post's Group, then delegates to (1). The remove_group_member ->
--      operator_remove_group_member pattern (20261030172102).
--   3. is_caller_banned + "Creators can read their own groups" — the ban
--      check the creator policy was missing.
--
-- No schema change.
--
-- What a take-down can't undo: edition emails already sent. They carry the
-- story's words, and those can't be recalled. Their photos are 1-year signed
-- URLs (_shared/edition-dispatch.ts, PHOTO_URL_TTL_SECONDS) to these files,
-- so deleting the files is what makes the photos stop loading in those
-- emails. That is deliberate, and the confirmation in the app says so.
--
-- An edition whose last story is taken down stays, with no stories: its
-- number is part of the Group's record, and the front page already reads an
-- empty edition as a page (app/edition/[id]/index.tsx).
-- ============================================================

-- ------------------------------------------------------------
-- 1. operator_take_down_post
-- ------------------------------------------------------------
-- Every file of a post sits in <author_id>/posts/<post_id>/: the photo
-- masters and display copies, and a legacy post's image.jpg. The storage
-- write policies pin [1] to the uploader and [2] to 'posts', and
-- posts_blocks_valid (20261003154759) pins every block path inside that
-- folder. All three segments are matched here, so nothing outside the
-- author's own folder for this post can be touched.
--
-- Returns what it did, so an operator running it from the SQL editor can see
-- it worked (photo_files_deleted is the number to check the first time it
-- runs in production — see the storage guard below).
create or replace function public.operator_take_down_post(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post record;
  v_files int;
begin
  -- Locked so a compile picking up this post, or a second take-down, waits
  -- for this one rather than racing it.
  select id, group_id, author_id, edition_id
    into v_post
  from public.posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'post_not_found' using errcode = 'P0001';
  end if;

  -- storage.protect_delete is a statement-level trigger that refuses any
  -- direct DELETE on storage.objects, even one matching no rows, unless this
  -- transaction-local flag is on (20260923003208). CI never executes this
  -- line, and the local stand-in only imitates the trigger, so the first
  -- production take-down is the proof that it works.
  perform set_config('storage.allow_delete_query', 'true', true);

  with deleted as (
    delete from storage.objects
    where bucket_id = 'post-images'
      and (storage.foldername(name))[1] = v_post.author_id::text
      and (storage.foldername(name))[2] = 'posts'
      and (storage.foldername(name))[3] = v_post.id::text
    returning 1
  )
  select count(*) into v_files from deleted;

  delete from public.posts where id = v_post.id;

  return jsonb_build_object(
    'post_id', v_post.id,
    'group_id', v_post.group_id,
    'edition_id', v_post.edition_id,
    'author_id', v_post.author_id,
    'photo_files_deleted', v_files
  );
end;
$$;

-- No caller-side check inside, so no client may reach it. take_down_post
-- calls it as the owner; operators call it with the service role or from the
-- SQL editor.
revoke execute on function public.operator_take_down_post(uuid)
  from public, anon, authenticated;
grant execute on function public.operator_take_down_post(uuid) to service_role;

-- ------------------------------------------------------------
-- 2. take_down_post
-- ------------------------------------------------------------
-- A moderator may take down any story in their Group, their own included,
-- and in any edition, past ones included.
--
-- Someone outside the Group gets post_not_found, not not_moderator: the posts
-- SELECT policy already hides the post from them, and the RPC shouldn't tell
-- them it exists.
create or replace function public.take_down_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_group_id uuid;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select group_id into v_group_id
  from public.posts
  where id = p_post_id;

  if v_group_id is null or not public.is_group_member(v_group_id, v_actor) then
    raise exception 'post_not_found' using errcode = 'P0001';
  end if;

  if not public.is_group_moderator(v_group_id, v_actor) then
    raise exception 'not_moderator' using errcode = 'P0001';
  end if;

  perform public.operator_take_down_post(p_post_id);
end;
$$;

revoke execute on function public.take_down_post(uuid) from public, anon;
grant execute on function public.take_down_post(uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. "Creators can read their own groups", minus a removed creator
-- ------------------------------------------------------------
-- Why the policy exists (20260425200000): createGroup inserts with RETURNING
-- (PostgREST's insert().select()). Postgres checks the new row against the
-- SELECT policies before the AFTER INSERT trigger handle_new_group makes the
-- creator a member, so without this policy "Members can read their groups"
-- fails and the insert errors with "new row violates row-level security
-- policy". It has to keep passing at that moment.
--
-- The hole: it never stopped matching. A creator who was removed — banned
-- since 20261030172102 — could still read the Group row, invite code
-- included, and hand the code to a second account.
--
-- Why a function, and not `not exists (select 1 from group_bans ...)` in the
-- policy: a subquery in a policy runs as the caller, with group_bans' own RLS
-- applied, and that table is readable only by the Group's moderators. The
-- removed creator would never see their own ban, the subquery would always
-- be empty, and the policy would let them read exactly as before (replayed
-- on PostgreSQL 17 with this repo's migration history, 2026-11-01).
--
-- The function answers only for the caller. A two-argument
-- is_banned(group, user) would let any member ask who has been removed,
-- which group_bans' moderator-only SELECT policy exists to prevent.
create or replace function public.is_caller_banned(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_bans
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- Policies run their functions as the querying role, so authenticated needs
-- EXECUTE. The policy below is for authenticated only, so anon never does.
revoke execute on function public.is_caller_banned(uuid) from public, anon;
grant execute on function public.is_caller_banned(uuid) to authenticated;

-- A brand-new Group has no bans, so the creator's insert...returning passes as
-- before. A creator who left without being removed still matches; they can
-- rejoin with the code anyway, so the row tells them nothing new.
drop policy if exists "Creators can read their own groups" on public.groups;

create policy "Creators can read their own groups"
  on public.groups for select
  to authenticated
  using (created_by = auth.uid() and not public.is_caller_banned(id));
