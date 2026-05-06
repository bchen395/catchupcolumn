import { useEffect, useState } from 'react';

import { getPostImageDisplayUrl } from '@/lib/posts';

/**
 * Resolve the raw value stored in `posts.image_url` (either a private
 * storage path that must be signed, or a passthrough URL/file URI) to a
 * URI that an `<Image>` can render.
 *
 * Returns `null` while resolving or when no image is set.
 */
export const usePostImageUrl = (raw: string | null | undefined): string | null => {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!raw) {
      setResolved(null);
      return;
    }
    getPostImageDisplayUrl(raw).then((url) => {
      if (!cancelled) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [raw]);

  return resolved;
};
