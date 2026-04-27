import { supabase } from '@/lib/supabase';
import type { PostInsert, PostRow, PostUpdate } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getFileExtension = (uri: string, mimeType?: string | null): string => {
  if (mimeType) {
    const ext = mimeType.split('/')[1];
    if (ext) return ext.replace('jpeg', 'jpg');
  }
  const match = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's most recent uncompiled post for a group.
 * "Uncompiled" means edition_id IS NULL — it hasn't been published yet.
 */
export const fetchCurrentPost = async (
  groupId: string,
  userId: string
): Promise<PostRow | null> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('group_id', groupId)
    .eq('author_id', userId)
    .is('edition_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// ---------------------------------------------------------------------------
// Create / Update / Delete
// ---------------------------------------------------------------------------

export const createPost = async (
  input: Pick<PostInsert, 'group_id' | 'author_id' | 'body' | 'image_url'>
): Promise<PostRow> => {
  const { data, error } = await supabase
    .from('posts')
    .insert(input)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updatePost = async (
  postId: string,
  updates: PostUpdate
): Promise<PostRow> => {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deletePost = async (postId: string): Promise<void> => {
  const { error } = await supabase.from('posts').delete().eq('id', postId);

  if (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Image upload
// ---------------------------------------------------------------------------

/**
 * Upload a post image to the `post-images` bucket and return its public URL.
 * If a previous image exists at the same path it will be replaced (upsert).
 */
export const uploadPostImage = async (
  postId: string,
  imageUri: string,
  mimeType?: string | null
): Promise<string> => {
  const imageResponse = await fetch(imageUri);
  const imageBuffer = await imageResponse.arrayBuffer();
  const ext = getFileExtension(imageUri, mimeType);
  const contentType = mimeType ?? (ext === 'png' ? 'image/png' : 'image/jpeg');
  const storagePath = `posts/${postId}/image.${ext}`;

  const { error } = await supabase.storage
    .from('post-images')
    .upload(storagePath, imageBuffer, { contentType, upsert: true });

  if (error) {
    throw error;
  }

  return supabase.storage.from('post-images').getPublicUrl(storagePath).data.publicUrl;
};
