-- ============================================================
-- 20260430000000_scope_post_images_to_group_members.sql
-- Tighten post-images SELECT so only members of the post's
-- group can read its image. Previously any authenticated user
-- with the URL/path could fetch it.
--
-- Path layout: <user_id>/posts/<post_id>/image.<ext>
-- Lookup: storage.foldername(name) = {user_id, "posts", post_id}
-- ============================================================

drop policy if exists "Column members can read post images" on storage.objects;
drop policy if exists "Group members can read post images" on storage.objects;

create policy "Group members can read post images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'post-images'
    and exists (
      select 1
      from public.posts p
      where p.id::text = (storage.foldername(name))[3]
        and public.is_group_member(p.group_id, auth.uid())
    )
  );
