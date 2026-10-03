import { useCallback, useState } from 'react';

// A photo's display shape on the page. Natural ratios snap to newspaper crop
// buckets — every photo is landscape, portrait, or square, the way a print
// paper crops to its column grid rather than honoring each camera's exact
// frame.
export type ImageOrientation = 'landscape' | 'portrait' | 'square';

// A photo's pixel size when it's already known — post photo blocks carry
// their master's width/height (null on legacy photos, which predate it).
export type KnownImageSize = { width: number | null; height: number | null };

// Natural width/height ratio cached by the raw storage path being shown, so the
// front page, the enlarge overlay's section snapshot, and the story reader all
// agree on a photo's shape from their first frame once any one of them has
// loaded the image. Module-level on purpose: survives navigation for the
// session.
const ratioCache = new Map<string, number>();

// Anything within ~15% of square reads as square inside a small frame.
const LANDSCAPE_MIN = 1.15;
const PORTRAIT_MAX = 1 / LANDSCAPE_MIN;

const orientationOf = (ratio: number): ImageOrientation => {
  if (ratio >= LANDSCAPE_MIN) return 'landscape';
  if (ratio <= PORTRAIT_MAX) return 'portrait';
  return 'square';
};

const ratioOf = (size: KnownImageSize | null | undefined): number | null =>
  size?.width && size.height && size.width > 0 && size.height > 0
    ? size.width / size.height
    : null;

// The crop EditorialPhoto renders for each bucket.
export const displayRatioFor = (orientation: ImageOrientation): number => {
  if (orientation === 'landscape') return 4 / 3;
  if (orientation === 'portrait') return 4 / 5;
  return 1;
};

// Orientation for a post photo. When the photo's size is already known (a
// multi-photo post's block records it at upload) it's right from the first
// frame, so the page reserves the photo's real shape and nothing moves when
// it loads. Otherwise (legacy photos) it's learned from the image's natural
// dimensions as it loads — no separate measuring fetch: null until then
// (callers lay out as landscape meanwhile, the common case), flipping at most
// once. Wire `onNaturalSize` to the EditorialPhoto showing the photo.
export const useImageOrientation = (
  raw: string | null | undefined,
  knownSize?: KnownImageSize | null,
): {
  orientation: ImageOrientation | null;
  onNaturalSize: (width: number, height: number) => void;
} => {
  // Tagged with the photo it measured, so a hook re-pointed at a different
  // photo never shows the previous one's shape for a frame.
  const [measured, setMeasured] = useState<{ raw: string; ratio: number } | null>(null);

  const onNaturalSize = useCallback(
    (width: number, height: number) => {
      if (!raw || width <= 0 || height <= 0) return;
      const ratio = width / height;
      ratioCache.set(raw, ratio);
      setMeasured({ raw, ratio });
    },
    [raw],
  );

  // This instance's measurement, else one another surface made this session.
  // A measurement outranks the recorded size: they agree for every photo
  // uploaded correctly, and if one ever didn't, the loaded pixels are the
  // truth.
  const measuredRatio = !raw
    ? null
    : measured?.raw === raw
      ? measured.ratio
      : (ratioCache.get(raw) ?? null);
  const ratio = measuredRatio ?? ratioOf(knownSize);
  return { orientation: ratio == null ? null : orientationOf(ratio), onNaturalSize };
};
