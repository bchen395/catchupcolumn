-- ============================================================
-- 20261003154759_multi_photo_posts.sql
--
-- Multi-photo posts (design/MULTI_PHOTO_POSTS.md, decided 2026-10-03). A post
-- becomes one flow of plain text with up to four photos set into it, stored
-- in reading order as `posts.blocks`:
--
--   [{"type":"text","text":"..."},
--    {"type":"photo","id":"mfx2k9q3a1b2c3",
--     "path":"<author_id>/posts/<post_id>/mfx2k9q3a1b2c3.jpg",
--     "display_path":"<author_id>/posts/<post_id>/mfx2k9q3a1b2c3-display.jpg",
--     "width":2600,"height":1950},
--    {"type":"text","text":"..."}]
--
-- 1. posts.blocks jsonb, nullable, no backfill. Null is a post from before
--    multi-photo or from a build that predates it; every reader goes through
--    postBlocksOf() (lib/post-blocks.ts, mirrored in
--    supabase/functions/_shared/post-blocks.ts), which turns a null into the
--    legacy [photo?, text]. `body` and `image_url` stay, derived from blocks
--    on every save (toPostFields), so old builds, excerpts and push copy keep
--    working. This migration is backward compatible: old clients never write
--    blocks, and nothing here reads it except the email payload.
--
-- 2. posts_blocks_valid — a CHECK on public.post_blocks_valid(blocks,
--    author_id, id). Shape (text and photo blocks, nothing else), at most 4
--    photos (MAX_POST_PHOTOS in lib/post-blocks.ts — change both together),
--    and every photo `path` and non-null `display_path` names a file directly
--    inside the author's own post folder, <author_id>/posts/<post_id>/.
--
--    The folder rule is the security half. The edition-email worker signs
--    every photo with the service role, which bypasses storage RLS; without
--    the rule an author could point a block at another member's file — or a
--    file in a Group they were never in — and have it signed into their own
--    Group's email. With it, a block can only name a file under the author's
--    own uid (which storage RLS lets only them write) in this post's folder
--    (which the read policy, member removal and account deletion all key on).
--    The worker re-checks the folder too, which also covers legacy
--    `image_url`, a column this migration deliberately leaves unconstrained:
--    the 10-04 binary still writes it, and a legacy row may hold an old public
--    URL.
--
--    Not enforced here: the composer's tidiness invariants (no empty or
--    adjacent text pieces), and body/image_url agreeing with blocks — an old
--    build editing a multi-photo draft writes body and image_url alone, an
--    accepted risk (design doc, "Compatibility") that a constraint would turn
--    into a failed save.
--
-- 3. get_edition_email_payload returns each post's `blocks` and `author_id`
--    (the worker needs the author for the folder re-check). Recreated from its
--    latest definition, 20260711000000_edition_email_payload_images.sql; the
--    rest is unchanged, grants included.
--
-- Grants: posts has no column-level grants (20260703000000 did column grants
-- on users and group_members only), so `authenticated` reaches the new column
-- through its existing table privileges, with the existing RLS policies. The
-- compile and publish RPCs select only id/created_at from posts, and the
-- post-images read policy reads id/group_id, so none of them change.
--
-- Storage: photo files are <author_id>/posts/<post_id>/<photo_id>.jpg and
-- <photo_id>-display.jpg — the same folder as the legacy image.jpg. Member
-- removal (remove_group_member, 20260923003208) deletes every object whose
-- third path segment is a removed post's id, and account deletion
-- (prepare_account_deletion, same migration) every object under the user's
-- uid, so both already remove the new files. No change.
-- ============================================================

-- ------------------------------------------------------------
-- 1. The column
-- ------------------------------------------------------------
alter table public.posts
  add column if not exists blocks jsonb;

comment on column public.posts.blocks is
  'Reading-order pieces of the post: {type:text,text} and {type:photo,id,path,display_path,width,height}. '
  'Null on posts from before multi-photo; read through postBlocksOf(). body and image_url are derived from it.';

-- ------------------------------------------------------------
-- 2. Validation
-- ------------------------------------------------------------
-- Invoker rights, immutable, no table access: a pure function of its inputs,
-- so it can back a CHECK constraint. plpgsql rather than SQL so the order of
-- tests is explicit — jsonb_array_elements() raises on a non-array, and SQL
-- does not promise to evaluate an AND left to right. Every test is written so
-- a null can only ever reject, never slip through an IF.
create or replace function public.post_blocks_valid(
  p_blocks jsonb,
  p_author_id uuid,
  p_post_id uuid
)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  -- The author's own folder for this post. uuid::text is lowercase, as are
  -- the ids the app and the operator script build paths from.
  v_folder constant text := p_author_id::text || '/posts/' || p_post_id::text || '/';
  -- One file name directly inside that folder: <photo_id>.jpg,
  -- <photo_id>-display.jpg, or the legacy image.jpg. A single dot and no
  -- slash, so neither `..` nor a subfolder can climb out of it.
  c_file_name constant text := '^[A-Za-z0-9][A-Za-z0-9_-]*\.[A-Za-z0-9]+$';
  v_block jsonb;
  v_key text;
  v_value jsonb;
  v_photos int := 0;
begin
  if p_blocks is null then
    return true;
  end if;

  if jsonb_typeof(p_blocks) <> 'array' then
    return false;
  end if;

  for v_block in select b from jsonb_array_elements(p_blocks) as t(b)
  loop
    if jsonb_typeof(v_block) <> 'object' then
      return false;
    end if;

    if v_block->>'type' = 'text' then
      if exists (
        select 1 from jsonb_object_keys(v_block) as k(name)
        where k.name not in ('type', 'text')
      ) then
        return false;
      end if;

      if jsonb_typeof(v_block->'text') is distinct from 'string' then
        return false;
      end if;

    elsif v_block->>'type' = 'photo' then
      v_photos := v_photos + 1;
      if v_photos > 4 then
        return false;
      end if;

      if exists (
        select 1 from jsonb_object_keys(v_block) as k(name)
        where k.name not in ('type', 'id', 'path', 'display_path', 'width', 'height')
      ) then
        return false;
      end if;

      -- Lowercase alphanumerics (newPhotoId; 'legacy' is how postBlocksOf
      -- names a pre-multi-photo photo, and a composer may save it back).
      if jsonb_typeof(v_block->'id') is distinct from 'string' then
        return false;
      end if;
      if (v_block->>'id') !~ '^[a-z0-9]{1,64}$' then
        return false;
      end if;

      -- path is required; display_path may be absent or null (no display
      -- copy). Both, when present, must be a file in this post's folder.
      foreach v_key in array array['path', 'display_path']
      loop
        v_value := v_block->v_key;
        if v_key = 'display_path' and (v_value is null or jsonb_typeof(v_value) = 'null') then
          continue;
        end if;
        if jsonb_typeof(v_value) is distinct from 'string' then
          return false;
        end if;
        if not starts_with(v_value #>> '{}', v_folder) then
          return false;
        end if;
        if substr(v_value #>> '{}', length(v_folder) + 1) !~ c_file_name then
          return false;
        end if;
      end loop;

      -- The master's pixel size: absent/null on legacy photos, otherwise a
      -- positive number (layouts divide by it).
      foreach v_key in array array['width', 'height']
      loop
        v_value := v_block->v_key;
        if v_value is null or jsonb_typeof(v_value) = 'null' then
          continue;
        end if;
        if jsonb_typeof(v_value) <> 'number' then
          return false;
        end if;
        if (v_value #>> '{}')::numeric <= 0 then
          return false;
        end if;
      end loop;

    else
      return false;
    end if;
  end loop;

  return true;
end;
$$;

-- A CHECK runs its function as the role doing the write, so `authenticated`
-- (the app's inserts and updates) and `service_role` (the operator script)
-- need EXECUTE. It reads nothing and returns a boolean, so exposing it as an
-- RPC is harmless; anon has no reason to call it.
revoke all on function public.post_blocks_valid(jsonb, uuid, uuid) from public, anon;
grant execute on function public.post_blocks_valid(jsonb, uuid, uuid) to authenticated, service_role;

-- Every existing row has blocks null, so this validates instantly. Guarded so
-- the migration is safe to re-run (as posts_title_length is).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'posts_blocks_valid'
  ) then
    alter table public.posts
      add constraint posts_blocks_valid
      check (public.post_blocks_valid(blocks, author_id, id));
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. Email payload: each post's blocks and author_id
--    (recreated from 20260711000000_edition_email_payload_images.sql)
-- ------------------------------------------------------------
create or replace function public.get_edition_email_payload(p_edition_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_edition record;
  v_group record;
  v_posts jsonb;
  v_recipients jsonb;
begin
  select id, group_id, edition_number, published_at, emailed_at, email_attempts
  into v_edition
  from public.editions
  where id = p_edition_id;

  if not found then
    return null;
  end if;

  select id, name
  into v_group
  from public.groups
  where id = v_edition.group_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'author_id', p.author_id,
      'title', p.title,
      'body', p.body,
      'image_url', p.image_url,
      'blocks', p.blocks,
      'author_name', u.display_name,
      'author_avatar_url', u.avatar_url,
      'created_at', p.created_at
    )
    order by p.created_at
  ), '[]'::jsonb)
  into v_posts
  from public.posts p
  join public.users u on u.id = p.author_id
  where p.edition_id = p_edition_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', u.id,
      'email', u.email,
      'display_name', u.display_name,
      'unsubscribe_token', gm.unsubscribe_token
    )
  ), '[]'::jsonb)
  into v_recipients
  from public.group_members gm
  join public.users u on u.id = gm.user_id
  where gm.group_id = v_edition.group_id
    and gm.email_subscribed = true;

  return jsonb_build_object(
    'edition_id', v_edition.id,
    'edition_number', v_edition.edition_number,
    'published_at', v_edition.published_at,
    'emailed_at', v_edition.emailed_at,
    'email_attempts', v_edition.email_attempts,
    'group_id', v_group.id,
    'group_name', v_group.name,
    'posts', v_posts,
    'recipients', v_recipients
  );
end;
$$;

-- Unchanged from 20260711000000: it returns recipient emails and unsubscribe
-- tokens, so service_role only (20260627000000).
revoke all on function public.get_edition_email_payload(uuid) from public, anon, authenticated;
grant execute on function public.get_edition_email_payload(uuid) to service_role;
