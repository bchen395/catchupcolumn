// The parts of lib/post-blocks.ts this script needs. Deno can't import that
// file (it reaches the types through the app's `@/` alias), so these mirror it
// line for line — change them together. The block types themselves come from
// the app's mirror, types/database.ts, as the other row shapes here do.
//
// A post is one flow of plain text with up to four photos set into it, stored
// as `posts.blocks` in reading order (design/MULTI_PHOTO_POSTS.md). The
// database checks the shape, the photo count and that every photo path is in
// the author's own post folder (posts_blocks_valid).

import type { PostBlock, PostPhotoBlock, PostRow } from '../../types/database.ts';

/** MAX_POST_PHOTOS. The database enforces the same number. */
export const MAX_POST_PHOTOS = 4;

/** postBlocksOf: a post's reading-order pieces; legacy posts become [photo?, text]. */
export const postBlocksOf = (post: Pick<PostRow, 'body' | 'image_url' | 'blocks'>): PostBlock[] => {
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

/** normalizeBlocks: text trimmed, empty pieces dropped, neighbours merged. */
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

/** toPostFields: everything a save writes, so body and image_url can't drift from blocks. */
export const toPostFields = (
  blocks: PostBlock[],
): Pick<PostRow, 'blocks' | 'body' | 'image_url'> => {
  const normalized = normalizeBlocks(blocks);
  const body = normalized.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n\n');
  const first = photoBlocksOf(normalized)[0];
  return { blocks: normalized, body, image_url: first ? first.path : null };
};

/** postPhotoPaths: the master and display-copy paths of one photo. */
export const postPhotoPaths = (
  authorId: string,
  postId: string,
  photoId: string,
): { path: string; display_path: string } => ({
  path: `${authorId}/posts/${postId}/${photoId}.jpg`,
  display_path: `${authorId}/posts/${postId}/${photoId}-display.jpg`,
});

/** newPhotoId: lowercase alphanumerics, unique within one post. */
export const newPhotoId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
