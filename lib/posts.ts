import { resizeImageForUpload } from '@/lib/image';
import { supabase } from '@/lib/supabase';
import type { PostInsert, PostRow, PostUpdate } from '@/types';

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

export type WeeklyByline = {
  authorId: string;
  /** First name only — bylines read warm ("Ruth"), never formal. */
  firstName: string;
  /** Full name + avatar feed the dateline strip's decorative face row. */
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Who has written for the upcoming editions of these Groups — authors of
 * uncompiled posts (edition_id IS NULL), deduped, in the order they first
 * filed. Feeds Home's "Ruth and Sam have written this week" line; it never
 * names who *hasn't* written.
 */
export const fetchThisWeeksBylines = async (groupIds: string[]): Promise<WeeklyByline[]> => {
  if (groupIds.length === 0) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('author_id, created_at, author:users(display_name, avatar_url)')
    .in('group_id', groupIds)
    .is('edition_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as {
    author_id: string;
    author: { display_name: string; avatar_url: string | null } | null;
  }[];

  const seen = new Set<string>();
  const bylines: WeeklyByline[] = [];
  for (const row of rows) {
    if (seen.has(row.author_id)) continue;
    seen.add(row.author_id);
    const displayName = (row.author?.display_name ?? '').trim();
    const firstName = displayName.split(/\s+/)[0];
    bylines.push({
      authorId: row.author_id,
      firstName: firstName || 'Someone',
      displayName: displayName || 'Someone',
      avatarUrl: row.author?.avatar_url ?? null,
    });
  }
  return bylines;
};

// ---------------------------------------------------------------------------
// Create / Update / Delete
// ---------------------------------------------------------------------------

export const createPost = async (
  input: Pick<PostInsert, 'group_id' | 'author_id' | 'body' | 'image_url' | 'title'>,
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
// Image upload + signing
// ---------------------------------------------------------------------------

// `posts.image_url` stores the storage path inside the `post-images` bucket
// (e.g. "<userId>/posts/<postId>/image.jpg"), not a full URL. The bucket is
// private so display URLs must be signed at read time via
// `getPostImageDisplayUrl`. Storing the path keeps the row stable as TTLs
// expire and re-sign cycles run.

const POST_IMAGE_BUCKET = 'post-images';
const POST_IMAGE_SIGNED_TTL_SECONDS = 60 * 60; // 1 hour

// Storage RLS on `post-images` requires the first path segment to equal
// auth.uid()::text, so the path must start with the uploading user's id.
export const uploadPostImage = async (
  userId: string,
  postId: string,
  imageUri: string,
  mimeType?: string | null
): Promise<string> => {
  // Resize + JPEG-recompress so we always upload at most ~1600px on the long
  // edge. Original camera shots are 4–6 MB and we don't need that fidelity.
  const resizedUri = await resizeImageForUpload(imageUri);
  const imageResponse = await fetch(resizedUri);
  if (!imageResponse.ok) {
    throw new Error(`Failed to read image for upload (${imageResponse.status})`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  // After resize we always have JPEG, so the extension is fixed.
  const storagePath = `${userId}/posts/${postId}/image.jpg`;

  const { error } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .upload(storagePath, imageBuffer, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    throw error;
  }

  return storagePath;
};

// Legacy rows stored the full public URL; extract the storage path so we can
// sign it. Matches `.../object/public/post-images/<path>`.
const LEGACY_PUBLIC_URL_RE = /\/storage\/v1\/object\/public\/post-images\/(.+)$/;

export const getPostImageDisplayUrl = async (
  rawImageUrl: string | null | undefined,
): Promise<string | null> => {
  if (!rawImageUrl) return null;

  let storagePath = rawImageUrl;

  if (/^(file:|data:)/i.test(rawImageUrl)) return rawImageUrl;

  if (/^https?:/i.test(rawImageUrl)) {
    const match = rawImageUrl.match(LEGACY_PUBLIC_URL_RE);
    if (!match) return rawImageUrl;
    storagePath = match[1];
  }

  const { data, error } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .createSignedUrl(storagePath, POST_IMAGE_SIGNED_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
};
