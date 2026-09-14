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

// Post images are sized for print, not for the screen — they are the only
// images that can end up in a bound volume, and the resolution ceiling is set
// irreversibly at upload time. 2600px on the long edge is ~8.7in at 300 DPI,
// enough for a full-page photo on a typical trim size; the display surfaces
// (app + email) just downscale. Group covers and avatars stay display-sized.
//
// Quality is 0.9 rather than the 0.82 display default because print shows JPEG
// artifacts that a phone screen hides. The composer's picker is set to quality
// 1 so this is the only lossy pass. See docs/POSITIONING.md §5.
const POST_IMAGE_MAX_EDGE = 2600;
const POST_IMAGE_QUALITY = 0.9;

// Storage RLS on `post-images` requires the first path segment to equal
// auth.uid()::text, so the path must start with the uploading user's id.
export const uploadPostImage = async (
  userId: string,
  postId: string,
  imageUri: string,
): Promise<string> => {
  // Resize + JPEG-recompress at print bounds (see POST_IMAGE_MAX_EDGE above).
  const resizedUri = await resizeImageForUpload(imageUri, {
    maxEdge: POST_IMAGE_MAX_EDGE,
    quality: POST_IMAGE_QUALITY,
  });
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

// Signed URLs, cached by storage path for the session.
//
// Without this, every mount of every photo costs a round-trip to Storage: an
// edition front page signs the lead, the secondary, and each brief
// separately, then signs them all again when you open a story and again when
// you come back. The signature is valid for an hour and the same path always
// signs to an equivalent URL, so there is nothing to gain from re-asking.
// Module-level, matching the ratio cache in `use-image-orientation`.
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

// Re-sign a minute early rather than handing out a URL that expires
// mid-download on a slow connection.
const SIGNED_URL_REFRESH_MARGIN_MS = 60 * 1000;

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

  const cached = signedUrlCache.get(storagePath);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .createSignedUrl(storagePath, POST_IMAGE_SIGNED_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  signedUrlCache.set(storagePath, {
    url: data.signedUrl,
    expiresAt: Date.now() + POST_IMAGE_SIGNED_TTL_SECONDS * 1000 - SIGNED_URL_REFRESH_MARGIN_MS,
  });
  return data.signedUrl;
};

// Drop every cached signature. Called on sign-out: the URLs were signed with
// the previous session's credentials and must not leak into the next account.
export const clearPostImageUrlCache = (): void => {
  signedUrlCache.clear();
};
