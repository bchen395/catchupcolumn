import type { PostBlock, PostPhotoBlock, PostRow } from '@/types';

// A post is one flow of plain text with photos set into it, stored as
// `posts.blocks` in reading order. design/MULTI_PHOTO_POSTS.md has the
// decisions; this file is the one place the app shapes and reads blocks. The
// edge functions can't import from here — `supabase/functions/_shared` keeps
// its own reader of the same shape.

// Up to four photos in one post (decided 2026-10-03: storage on the Free plan,
// email length, and printed page count; easy to raise, unkind to lower). The
// database enforces the same number — change both together.
export const MAX_POST_PHOTOS = 4;

type PostLike = Pick<PostRow, 'body' | 'image_url'> & { blocks?: PostBlock[] | null };

// The reading-order pieces of any post. Posts from before multi-photo (and
// from builds that predate it) have no blocks: their one photo ran above the
// text, so that's the order they get.
export const postBlocksOf = (post: PostLike): PostBlock[] => {
  if (post.blocks && post.blocks.length > 0) return post.blocks;

  const blocks: PostBlock[] = [];
  if (post.image_url) {
    blocks.push({
      type: 'photo',
      id: 'legacy',
      path: post.image_url,
      display_path: null,
      width: null,
      height: null,
    });
  }
  if (post.body.trim() !== '') blocks.push({ type: 'text', text: post.body });
  return blocks;
};

export const photoBlocksOf = (blocks: PostBlock[]): PostPhotoBlock[] =>
  blocks.filter((b): b is PostPhotoBlock => b.type === 'photo');

// What a screen or email should load for a photo: the display copy when there
// is one, the print master otherwise (legacy photos, or a display upload that
// failed). Never use `path` directly for display — it's the 2600px master.
export const photoDisplayPath = (photo: PostPhotoBlock): string =>
  photo.display_path ?? photo.path;

// The stored form: each text piece trimmed, empty ones dropped, neighbours
// merged with a blank line. The composer may hold empty or adjacent text
// pieces while someone writes (there is always somewhere to type after a
// photo); storage never does.
export const normalizeBlocks = (blocks: PostBlock[]): PostBlock[] => {
  const out: PostBlock[] = [];
  for (const block of blocks) {
    if (block.type === 'photo') {
      out.push(block);
      continue;
    }
    const text = block.text.trim();
    if (text === '') continue;
    const prev = out[out.length - 1];
    if (prev?.type === 'text') {
      out[out.length - 1] = { type: 'text', text: `${prev.text}\n\n${text}` };
    } else {
      out.push({ type: 'text', text });
    }
  }
  return out;
};

// Everything a save writes, derived from one list of blocks, so `body` and
// `image_url` can never drift from `blocks`.
export const toPostFields = (
  blocks: PostBlock[],
): Pick<PostRow, 'blocks' | 'body' | 'image_url'> => {
  const normalized = normalizeBlocks(blocks);
  const body = normalized.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n\n');
  const first = photoBlocksOf(normalized)[0];
  return { blocks: normalized, body, image_url: first ? first.path : null };
};

// Storage paths for one photo. The first segment must be the author's id
// (storage RLS), and the third the post's id: the read policy, member removal
// and account deletion all find a post's files by that folder.
export const postPhotoPaths = (
  authorId: string,
  postId: string,
  photoId: string,
): Pick<PostPhotoBlock, 'path'> & { display_path: string } => ({
  path: `${authorId}/posts/${postId}/${photoId}.jpg`,
  display_path: `${authorId}/posts/${postId}/${photoId}-display.jpg`,
});

// Only needs to be unique within one post — it names a file in the post's own
// folder. Lowercase alphanumerics, so it's always a safe file name.
export const newPhotoId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
