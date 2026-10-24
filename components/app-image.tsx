import { Image, type ImageProps, type ImageSource } from 'expo-image';

import { Colors } from '@/constants/colors';

/**
 * Single image wrapper used across the app.
 *
 * Centralizing here makes it cheap to:
 *   - swap the underlying image library (expo-image → react-native-fast-image)
 *   - tune cache, transition, and placeholder behavior in one place
 *   - add a global blur/loading state later
 *
 * Usage:  <AppImage source={{ uri }} style={...} />
 *
 * Defaults match react-native's `<Image resizeMode="cover" />` so this is a
 * near drop-in replacement.
 */

// Post photos are private, so screens load them through signed Storage URLs
// (lib/posts.ts → getPostImageDisplayUrl). expo-image caches by URL, and a
// signed URL's `?token=` changes every session, so every photo was downloaded
// again every session — on the Free plan's 5 GB/month egress, that is the
// budget (design/MULTI_PHOTO_POSTS.md, "App image cache"). Keying the cache by
// the URL without its query string makes it one entry per storage object.
//
// That is only right for files that never change under the same name. Photo
// files are (<photo_id>.jpg and <photo_id>-display.jpg — a new photo gets a
// new id), but the single-photo composer overwrites its draft's `image.jpg`
// in place when a photo is swapped, so that name keeps the per-URL key.
// Nothing here widens access: an image is only requested once the reader's
// own session has signed its URL, and signing is where Storage RLS applies.
const SIGNED_STORAGE_URL_RE = /\/storage\/v1\/object\/sign\//;
const OVERWRITTEN_IN_PLACE_RE = /\/image\.[A-Za-z0-9]+$/;

const stableCacheKey = (uri: string): string | undefined => {
  if (!SIGNED_STORAGE_URL_RE.test(uri)) return undefined;
  const withoutQuery = uri.split(/[?#]/)[0];
  if (OVERWRITTEN_IN_PLACE_RE.test(withoutQuery)) return undefined;
  return withoutQuery;
};

const withCacheKey = (source: ImageSource): ImageSource => {
  if (source.cacheKey || !source.uri) return source;
  const cacheKey = stableCacheKey(source.uri);
  return cacheKey ? { ...source, cacheKey } : source;
};

// Every shape expo-image's `source` accepts. Only URI sources (a string, an
// object with `uri`, or arrays of either) can be signed URLs; a require()'d
// asset number, an `sf:` symbol, a SharedRef or null passes through as is.
const withStableCacheKeys = (source: ImageProps['source']): ImageProps['source'] => {
  if (typeof source === 'string') {
    const cacheKey = stableCacheKey(source);
    return cacheKey ? { uri: source, cacheKey } : source;
  }
  if (Array.isArray(source)) {
    return source.map((s: ImageSource | string) =>
      typeof s === 'string' ? withCacheKey({ uri: s }) : withCacheKey(s),
    );
  }
  if (source && typeof source === 'object' && 'uri' in source) {
    return withCacheKey(source);
  }
  return source;
};

export const AppImage = ({
  contentFit = 'cover',
  transition = 200,
  cachePolicy = 'memory-disk',
  placeholderContentFit = 'cover',
  style,
  source,
  ...props
}: ImageProps) => {
  return (
    <Image
      contentFit={contentFit}
      transition={transition}
      cachePolicy={cachePolicy}
      placeholderContentFit={placeholderContentFit}
      // A quiet ink-wash placeholder — reads as an unloaded printed photo in
      // both the v2 and remaining v1 surfaces (peach retired, BRAND §14).
      style={[{ backgroundColor: Colors.hairline }, style]}
      source={withStableCacheKeys(source)}
      {...props}
    />
  );
};
