-- Edition email redesign: include each post's photo in the email payload.
--
-- The redesigned edition email renders post photos (signed at send time by
-- the dispatch worker). Recreates `get_edition_email_payload` from
-- 20260603000000_add_post_title.sql adding `image_url` — the raw storage
-- path (or legacy public URL) exactly as stored on `posts`; the edge
-- function normalizes and signs it.
--
-- Security posture is unchanged and re-asserted below: this function
-- returns recipient emails + unsubscribe tokens, so it is service_role
-- only (see 20260627000000_revoke_public_execute_on_service_rpcs.sql).

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
      'title', p.title,
      'body', p.body,
      'image_url', p.image_url,
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

revoke all on function public.get_edition_email_payload(uuid) from public, anon, authenticated;
grant execute on function public.get_edition_email_payload(uuid) to service_role;
