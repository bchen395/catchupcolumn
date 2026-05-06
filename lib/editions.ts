import { supabase } from '@/lib/supabase';
import type { EditionRow, EditionWithPosts, GroupRow, PostRow, UserRow } from '@/types';

export type EditionListItem = EditionRow & {
  group: Pick<GroupRow, 'id' | 'name' | 'cover_image_url' | 'timezone'>;
};

export const fetchEditionsForUser = async (userId: string): Promise<EditionListItem[]> => {
  // Filter explicitly by group membership rather than relying on RLS to hide
  // non-member rows. Two-step keeps the second query's plan simple.
  const { data: memberships, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (membershipError) {
    throw membershipError;
  }

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('editions')
    .select(
      `id, group_id, edition_number, published_at, created_at,
       group:groups!inner(id, name, cover_image_url, timezone)`,
    )
    .in('group_id', groupIds)
    .order('published_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as EditionListItem[];
};

// Hand-written shape for the editions+posts+author join. Drop in favor of
// generated relationships once `supabase gen types` is wired up (#29).
type EditionRowWithPosts = EditionRow & {
  posts: (PostRow & { author: UserRow })[];
};

export const fetchEditionWithPosts = async (editionId: string): Promise<EditionWithPosts> => {
  const { data, error } = await supabase
    .from('editions')
    .select(
      `id, group_id, edition_number, published_at, created_at,
       posts(
         id, group_id, author_id, body, image_url, edition_id, created_at, updated_at,
         author:users(id, display_name, avatar_url, bio, email, created_at)
       )`,
    )
    .eq('id', editionId)
    .single();

  if (error) {
    throw error;
  }

  const row = data as unknown as EditionRowWithPosts;
  const sortedPosts = [...row.posts].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  return { ...row, posts: sortedPosts };
};

export const fetchGroupForEdition = async (groupId: string): Promise<Pick<GroupRow, 'id' | 'name' | 'cover_image_url' | 'timezone'>> => {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, cover_image_url, timezone')
    .eq('id', groupId)
    .single();

  if (error) {
    throw error;
  }

  return data as Pick<GroupRow, 'id' | 'name' | 'cover_image_url' | 'timezone'>;
};
