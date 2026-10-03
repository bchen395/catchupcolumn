// post-blocks.ts
//
// The edge functions' reader for `posts.blocks` — a post as one flow of plain
// text with up to four photos set into it, in reading order
// (design/MULTI_PHOTO_POSTS.md). Deno can't import the app's code, so this
// mirrors the read side of lib/post-blocks.ts (`postBlocksOf`,
// `photoBlocksOf`, `photoDisplayPath`) and the block types in
// types/database.ts. Change them together.
//
// The database guarantees the shape (posts_blocks_valid,
// 20261003154759_multi_photo_posts.sql): text and photo blocks only, at most
// four photos, every photo path inside the author's own post folder.

export type PostTextBlock = { type: 'text'; text: string };

export type PostPhotoBlock = {
  type: 'photo';
  // Unique within its post; also the photo's file name in storage.
  id: string;
  // The print master: <author_id>/posts/<post_id>/<id>.jpg. On a legacy photo,
  // whatever `image_url` held (a path, or an old public URL).
  path: string;
  // The ~1280px display copy beside it (<id>-display.jpg). Null on legacy
  // photos and when the display upload failed.
  display_path: string | null;
  // The master's pixel size. Null on legacy photos.
  width: number | null;
  height: number | null;
};

export type PostBlock = PostTextBlock | PostPhotoBlock;

type PostLike = { body: string; image_url: string | null; blocks?: PostBlock[] | null };

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

// What an email should load for a photo: the display copy when there is one,
// the print master otherwise. Never send `path` itself when a display copy
// exists — it's the 2600px master, ~1.5 MB per recipient per open.
export const photoDisplayPath = (photo: PostPhotoBlock): string =>
  photo.display_path ?? photo.path;
