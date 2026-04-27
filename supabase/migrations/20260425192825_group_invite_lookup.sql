-- Allow unauthenticated invite code lookups via security definer (bypasses RLS)
create or replace function public.find_column_by_invite_code(p_invite_code text)
returns table (
  id            uuid,
  name          text,
  description   text,
  cover_image_url text,
  publish_day   int,
  publish_time  time,
  created_by    uuid,
  invite_code   text,
  created_at    timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select id, name, description, cover_image_url, publish_day, publish_time,
         created_by, invite_code, created_at
  from public.columns
  where invite_code = upper(trim(p_invite_code))
  limit 1;
$$;

-- Allow authenticated users to upload/update cover images to columns/ folder in avatars bucket
create policy "Authenticated users can upload group cover images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'columns'
  );

create policy "Authenticated users can update group cover images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'columns'
  );