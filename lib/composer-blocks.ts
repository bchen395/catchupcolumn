import { newPhotoId, postBlocksOf } from '@/lib/post-blocks';
import type { PostBlock, PostPhotoBlock, PostRow } from '@/types';

// The composer's working copy of a post: one flow of plain text with photos
// set into it (design/BRAND.md §9, "The composer"). Pure functions only — the
// screen, the hooks and the autosave all go through these, so the editing
// rules can be read (and checked) apart from the UI.
//
// The editor holds a looser shape than storage does. It is always
//
//     text (photo text)*
//
// — a text piece before the first photo, after the last, and between every
// two photos, even when that piece is empty. Each piece is a place the cursor
// can go, so you can always type above, between or below photos. Storage
// (lib/post-blocks.ts → toPostFields) drops the empty pieces and merges the
// rest; `blocksToSave` is the only bridge from here to there.

export type ComposerTextPiece = { kind: 'text'; key: string; text: string };

// 'waiting': picked, but the post has no row to file it under yet (the first
// autosave creates the row, and needs some words). 'uploading' → 'done', or
// 'failed', which offers retry or remove.
export type PhotoUpload = 'waiting' | 'uploading' | 'done' | 'failed';

export type ComposerPhoto = {
  kind: 'photo';
  key: string;
  // The photo's id within its post, and its file name in storage.
  id: string;
  // The picked file: the preview, and what gets uploaded. Null for photos
  // that came from the server, which display their stored copy.
  localUri: string | null;
  width: number | null;
  height: number | null;
  // The block to save, set once the upload finished (or loaded with the
  // post). Saves skip a photo until it has one.
  stored: PostPhotoBlock | null;
  upload: PhotoUpload;
};

export type ComposerBlock = ComposerTextPiece | ComposerPhoto;

// Where the cursor is (or should go): a text piece and an offset into it.
export type Caret = { key: string; position: number };

let keyCount = 0;
export const textPiece = (text = ''): ComposerTextPiece => {
  keyCount += 1;
  return { kind: 'text', key: `t${keyCount}`, text };
};

const photoFromStored = (photo: PostPhotoBlock): ComposerPhoto => ({
  kind: 'photo',
  key: `p-${photo.id}`,
  id: photo.id,
  localUri: null,
  width: photo.width,
  height: photo.height,
  stored: photo,
  upload: 'done',
});

// A freshly picked photo. Its id is fixed now, so retries overwrite the same
// file instead of leaving copies behind.
export const pickedPhoto = (asset: {
  uri: string;
  width?: number;
  height?: number;
}): ComposerPhoto => {
  const id = newPhotoId();
  return {
    kind: 'photo',
    key: `p-${id}`,
    id,
    localUri: asset.uri,
    width: asset.width || null,
    height: asset.height || null,
    stored: null,
    upload: 'waiting',
  };
};

// Restores the `text (photo text)*` shape: an empty piece wherever a photo
// would otherwise touch the start, the end, or another photo.
const canonical = (blocks: ComposerBlock[]): ComposerBlock[] => {
  const out: ComposerBlock[] = [];
  for (const block of blocks) {
    const prev = out[out.length - 1];
    if (block.kind === 'photo') {
      if (!prev || prev.kind === 'photo') out.push(textPiece());
      out.push(block);
    } else if (prev?.kind === 'text') {
      out[out.length - 1] = { ...prev, text: joinPieces(prev.text, block.text).text };
    } else {
      out.push(block);
    }
  }
  if (out.length === 0 || out[out.length - 1].kind === 'photo') out.push(textPiece());
  return out;
};

// The editor's starting state for a post, or a blank page. A legacy post's
// one photo opens above its text, where it always ran.
export const composerBlocksFrom = (
  post: Pick<PostRow, 'body' | 'image_url' | 'blocks'> | null,
): ComposerBlock[] =>
  canonical(
    post
      ? postBlocksOf(post).map((b) => (b.type === 'text' ? textPiece(b.text) : photoFromStored(b)))
      : [],
  );

// What a save writes (pass it to toPostFields): the text as typed, and only
// the photos whose upload has finished.
export const blocksToSave = (blocks: ComposerBlock[]): PostBlock[] =>
  blocks.flatMap((b): PostBlock[] => {
    if (b.kind === 'text') return [{ type: 'text', text: b.text }];
    return b.stored ? [b.stored] : [];
  });

// Two pieces of text becoming one where a photo used to sit between them.
// The photo stood for a paragraph break (storage joins pieces with a blank
// line), so that's what the join keeps; the offset is where the second piece
// now starts — the natural place for the cursor.
export const joinPieces = (above: string, below: string): { text: string; offset: number } => {
  const a = above.replace(/\s+$/, '');
  const b = below.replace(/^\s+/, '');
  if (a === '') return { text: below, offset: 0 };
  if (b === '') return { text: above, offset: above.length };
  return { text: `${a}\n\n${b}`, offset: a.length + 2 };
};

export const photosIn = (blocks: ComposerBlock[]): ComposerPhoto[] =>
  blocks.filter((b): b is ComposerPhoto => b.kind === 'photo');

export const textPiecesIn = (blocks: ComposerBlock[]): ComposerTextPiece[] =>
  blocks.filter((b): b is ComposerTextPiece => b.kind === 'text');

// Insert photos at the caret: the piece splits there, the photos go in in
// order (an empty piece between each two, so there's somewhere to type), and
// the caret moves to the start of the text after the last one. No caret means
// nothing was focused: they go at the end. The split drops the line breaks
// that met at the cut — the photo is the break now.
export const insertPhotos = (
  blocks: ComposerBlock[],
  at: Caret | null,
  photos: ComposerPhoto[],
): { blocks: ComposerBlock[]; caret: Caret } => {
  let index = at ? blocks.findIndex((b) => b.kind === 'text' && b.key === at.key) : -1;
  const atCaret = index >= 0;
  if (!atCaret) index = blocks.length - 1;
  const target = blocks[index] as ComposerTextPiece;
  const cut = atCaret ? Math.min(Math.max(at!.position, 0), target.text.length) : target.text.length;

  const above: ComposerTextPiece = { ...target, text: target.text.slice(0, cut).replace(/\s+$/, '') };
  const below = textPiece(target.text.slice(cut).replace(/^\s+/, ''));
  const inserted = photos.flatMap((p, i): ComposerBlock[] => (i === 0 ? [p] : [textPiece(), p]));

  return {
    blocks: [...blocks.slice(0, index), above, ...inserted, below, ...blocks.slice(index + 1)],
    caret: { key: below.key, position: 0 },
  };
};

// Take a photo out: the text above and below it become one piece, and the
// caret sits at the join. The merged piece keeps the key of whichever side
// the cursor was in (`keep`), so a focused field stays mounted and focused.
export const removePhoto = (
  blocks: ComposerBlock[],
  photoKey: string,
  keep: 'above' | 'below' = 'below',
): { blocks: ComposerBlock[]; removed: ComposerPhoto; caret: Caret } | null => {
  const index = blocks.findIndex((b) => b.kind === 'photo' && b.key === photoKey);
  if (index <= 0) return null;
  const above = blocks[index - 1] as ComposerTextPiece;
  const below = blocks[index + 1] as ComposerTextPiece;
  const { text, offset } = joinPieces(above.text, below.text);
  const key = keep === 'above' ? above.key : below.key;

  return {
    blocks: [...blocks.slice(0, index - 1), { kind: 'text', key, text }, ...blocks.slice(index + 2)],
    removed: blocks[index] as ComposerPhoto,
    caret: { key, position: offset },
  };
};

export const setPieceText = (
  blocks: ComposerBlock[],
  key: string,
  text: string,
): ComposerBlock[] => blocks.map((b) => (b.kind === 'text' && b.key === key ? { ...b, text } : b));

export const updatePhoto = (
  blocks: ComposerBlock[],
  key: string,
  patch: Partial<Pick<ComposerPhoto, 'stored' | 'upload'>>,
): ComposerBlock[] => blocks.map((b) => (b.kind === 'photo' && b.key === key ? { ...b, ...patch } : b));

// The photo sitting directly above a text piece, if there is one — what a
// backspace at the very start of that piece reaches for.
export const photoAbove = (blocks: ComposerBlock[], textKey: string): ComposerPhoto | null => {
  const index = blocks.findIndex((b) => b.kind === 'text' && b.key === textKey);
  const prev = index > 0 ? blocks[index - 1] : null;
  return prev?.kind === 'photo' ? prev : null;
};

// Backspace at the very start of a piece, just below a photo: the first press
// selects the photo (so it never vanishes by surprise), the next removes it.
// A held key's auto-repeat (`repeat`) only ever selects — removing a photo
// takes a fresh press.
export const backspaceAtStart = (
  blocks: ComposerBlock[],
  textKey: string,
  selection: { start: number; end: number },
  selectedPhotoKey: string | null,
  repeat: boolean,
): { action: 'none' } | { action: 'select' | 'remove'; photo: ComposerPhoto } => {
  if (selection.start !== 0 || selection.end !== 0) return { action: 'none' };
  const photo = photoAbove(blocks, textKey);
  if (!photo) return { action: 'none' };
  if (photo.key === selectedPhotoKey && !repeat) return { action: 'remove', photo };
  return { action: 'select', photo };
};

// "Photo 2 of 3" — screen readers hear where each photo sits.
export const photoPosition = (
  blocks: ComposerBlock[],
  photoKey: string,
): { number: number; total: number } => {
  const photos = photosIn(blocks);
  return { number: photos.findIndex((p) => p.key === photoKey) + 1, total: photos.length };
};

// The one piece that shows the "What's been happening…" placeholder: the last
// one, and only while there are no words anywhere — after a photo, that's
// where the cursor waits.
export const placeholderKey = (blocks: ComposerBlock[]): string | null => {
  const pieces = textPiecesIn(blocks);
  if (pieces.some((p) => p.text.trim() !== '')) return null;
  return pieces[pieces.length - 1]?.key ?? null;
};
