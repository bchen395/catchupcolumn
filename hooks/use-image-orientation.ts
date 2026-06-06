import { useCallback, useEffect, useState } from 'react';

// A photo's display shape on the page. Natural ratios snap to newspaper crop
// buckets — every photo is landscape, portrait, or square, the way a print
// paper crops to its column grid rather than honoring each camera's exact
// frame.
export type ImageOrientation = 'landscape' | 'portrait' | 'square';

// Natural width/height ratio cached by the raw `posts.image_url` value, so the
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

// The crop the polaroid frame renders for each bucket.
export const displayRatioFor = (orientation: ImageOrientation): number => {
  if (orientation === 'landscape') return 4 / 3;
  if (orientation === 'portrait') return 4 / 5;
  return 1;
};

// Orientation for a post photo, learned from the image's natural dimensions as
// it loads — no separate measuring fetch. Returns null until known (callers
// should lay out as landscape in the meantime, the common case) and flips at
// most once, when the rendered image reports its size. Wire `onNaturalSize` to
// the Polaroid showing the photo.
export const useImageOrientation = (
  raw: string | null | undefined,
): {
  orientation: ImageOrientation | null;
  onNaturalSize: (width: number, height: number) => void;
} => {
  const [ratio, setRatio] = useState<number | null>(() =>
    raw ? (ratioCache.get(raw) ?? null) : null,
  );

  // Re-sync if this hook instance is re-pointed at a different photo.
  useEffect(() => {
    setRatio(raw ? (ratioCache.get(raw) ?? null) : null);
  }, [raw]);

  const onNaturalSize = useCallback(
    (width: number, height: number) => {
      if (!raw || width <= 0 || height <= 0) return;
      const next = width / height;
      ratioCache.set(raw, next);
      setRatio(next);
    },
    [raw],
  );

  return { orientation: ratio == null ? null : orientationOf(ratio), onNaturalSize };
};
