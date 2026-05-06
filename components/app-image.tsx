import { Image, type ImageProps } from 'expo-image';

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

export const AppImage = ({
  contentFit = 'cover',
  transition = 200,
  cachePolicy = 'memory-disk',
  placeholderContentFit = 'cover',
  style,
  ...props
}: ImageProps) => {
  return (
    <Image
      contentFit={contentFit}
      transition={transition}
      cachePolicy={cachePolicy}
      placeholderContentFit={placeholderContentFit}
      style={[{ backgroundColor: Colors.backgroundWarm }, style]}
      {...props}
    />
  );
};
