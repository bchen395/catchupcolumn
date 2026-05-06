-- ============================================================
-- 20260505000020_group_covers_bucket.sql
-- Dedicated public bucket for group cover images.
--
-- Path layout: <group_id>/cover.jpg
-- - Public read so the join screen can render covers without RLS gymnastics
-- - Insert/update gated on moderator-of-the-group check via the path's
--   first segment.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('group-covers', 'group-covers', true)
on conflict (id) do nothing;

drop policy if exists "Group covers are publicly readable" on storage.objects;
drop policy if exists "Moderators can upload group covers" on storage.objects;
drop policy if exists "Moderators can update group covers" on storage.objects;
drop policy if exists "Moderators can delete group covers" on storage.objects;

create policy "Group covers are publicly readable"
  on storage.objects for select
  using (bucket_id = 'group-covers');

create policy "Moderators can upload group covers"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'group-covers'
    and public.is_group_moderator(
      ((storage.foldername(name))[1])::uuid,
      auth.uid()
    )
  );

create policy "Moderators can update group covers"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'group-covers'
    and public.is_group_moderator(
      ((storage.foldername(name))[1])::uuid,
      auth.uid()
    )
  );

create policy "Moderators can delete group covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'group-covers'
    and public.is_group_moderator(
      ((storage.foldername(name))[1])::uuid,
      auth.uid()
    )
  );
