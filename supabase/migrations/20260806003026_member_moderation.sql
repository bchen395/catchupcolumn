-- ============================================================
-- 20260806003026_member_moderation.sql
-- Moderator "remove member" — the eject half of the UGC
-- moderation pair Apple Guideline 1.2 expects (the report half
-- is client-side, mailto to support). Before this, the only
-- escape from an abusive member was for the victim to leave:
-- the group_members DELETE policy is `using (user_id = auth.uid())`,
-- so a moderator could not remove anyone.
--
-- Kept as an RPC rather than a widened DELETE policy because
-- ejecting is more than deleting the membership row — it must
-- also pull the removed member's *undelivered* drafts, or an
-- ejected member's pending post still lands in tomorrow's
-- edition and the ejection accomplishes nothing.
-- ============================================================

create or replace function public.remove_group_member(
  p_group_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_deleted_post_ids text[];
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not public.is_group_moderator(p_group_id, v_actor) then
    raise exception 'not_moderator' using errcode = 'P0001';
  end if;

  -- Removing yourself is "leave", not "eject". Routing it here would let a
  -- sole moderator sidestep the leave flow's transfer prompt, and the two
  -- actions want different confirmation copy.
  if p_user_id = v_actor then
    raise exception 'cannot_remove_self' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  ) then
    raise exception 'not_a_member' using errcode = 'P0001';
  end if;

  -- Drafts only (edition_id is null). Posts already compiled into a published
  -- edition stay put: that edition has been emailed and read, and rewriting it
  -- after the fact would leave members' inboxes disagreeing with the app.
  with deleted as (
    delete from public.posts
    where group_id = p_group_id
      and author_id = p_user_id
      and edition_id is null
    returning id
  )
  select array_agg(id::text) into v_deleted_post_ids from deleted;

  -- Their images go too. The post-images read policy joins back to public.posts
  -- (20260430000000), so these objects are already unreachable once the rows are
  -- gone — this just stops them accumulating as dead storage. Same mechanism as
  -- prepare_account_deletion: the definer is the table owner, so it may write
  -- storage.objects. Path layout is <user_id>/posts/<post_id>/image.<ext>.
  if v_deleted_post_ids is not null then
    delete from storage.objects
    where bucket_id = 'post-images'
      and (storage.foldername(name))[3] = any (v_deleted_post_ids);
  end if;

  -- prevent_last_moderator_removal still fires here, so ejecting the group's
  -- only moderator raises rather than orphaning the group.
  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;
end;
$$;

-- Authorization is enforced inside the function against auth.uid().
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
