import { supabase } from '@/lib/supabase';
import type { EditionRow, EditionWithPosts, GroupRow, PostRow, UserRow } from '@/types';

export type EditionListItem = EditionRow & {
  group: Pick<GroupRow, 'id' | 'name' | 'cover_image_url' | 'timezone'>;
};

export const fetchEditionsForUser = async (): Promise<EditionListItem[]> => {
  const { data, error } = await supabase
    .from('editions')
    .select(
      `id, group_id, edition_number, published_at, created_at,
       group:groups!inner(id, name, cover_image_url, timezone)`
    )
    .order('published_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as EditionListItem[];
};

export const fetchEditionWithPosts = async (editionId: string): Promise<EditionWithPosts> => {
  const { data, error } = await supabase
    .from('editions')
    .select(
      `id, group_id, edition_number, published_at, created_at,
       posts(
         id, group_id, author_id, body, image_url, edition_id, created_at, updated_at,
         author:users(id, display_name, avatar_url, bio, email, created_at)
       )`
    )
    .eq('id', editionId)
    .single();

  if (error) {
    throw error;
  }

  const row = data as unknown as EditionRow & {
    posts: (PostRow & { author: UserRow })[];
  };

  const sortedPosts = [...row.posts].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
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
