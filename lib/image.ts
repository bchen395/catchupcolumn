import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

/**
 * Image resize / compression helper used before uploading to storage.
 *
 * Why: phone cameras produce 4032×3024 (~6 MB) images. We don't need that for
 * a newsletter post — clamping the longest edge to 1600px reduces storage,
 * upload time, and bandwidth on the recipient side significantly while still
 * looking sharp on a high-DPR phone.
 */

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.82;

interface ResizeOptions {
  maxEdge?: number;
  quality?: number;
}

const getImageSize = (uri: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err),
    );
  });

/**
 * Resizes a local image URI so its longest edge is no greater than `maxEdge`,
 * then JPEG-compresses to `quality`. Returns the URI of the resulting image.
 *
 * If the image is already within bounds, only the JPEG re-encode is applied
 * to drop EXIF and benefit from compression (we never upscale).
 */
export const resizeImageForUpload = async (
  uri: string,
  options: ResizeOptions = {},
): Promise<string> => {
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;

  let actions: ImageManipulator.Action[] = [];
  try {
    const { width, height } = await getImageSize(uri);
    const longest = Math.max(width, height);
    if (longest > maxEdge) {
      const scale = maxEdge / longest;
      actions = [{ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } }];
    }
  } catch {
    // If we can't read dimensions, fall back to re-encode only.
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
};
