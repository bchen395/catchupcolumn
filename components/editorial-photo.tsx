import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { usePostImageUrl } from '@/hooks/use-post-image-url';

import { AppImage } from './app-image';
import { ThemedText } from './themed-text';

type Props = {
  // Raw `posts.image_url` value (storage path or passthrough URI). Signed on
  // demand by usePostImageUrl.
  imageUrl: string | null | undefined;
  // NYT-style credit line under the photo ("Photo by Ruth"). Left-aligned
  // Jost caption in inkSoft — microcopy, so the 12px caption size is legal.
  credit?: string;
  // Photo aspect ratio. Parents pass displayRatioFor(orientation).
  photoAspectRatio?: number;
  // Reports the image's natural pixel size once loaded — feeds
  // useImageOrientation so parents can adapt layout to portrait/landscape.
  onNaturalSize?: (width: number, height: number) => void;
  // Width (and any layout) for the block. Parent decides the size.
  style?: StyleProp<ViewStyle>;
};

// The flat editorial photo (BRAND §5) — v2's replacement for the retired
// polaroid. Square corners, no rotation, no frame, no shadow: just a hairline
// edge so the photo reads as printed on the page (newsprint photos have
// edges). With the illustration world carrying warmth, photos get to be
// dignified.
export const EditorialPhoto = ({
  imageUrl,
  credit,
  photoAspectRatio = 1,
  onNaturalSize,
  style,
}: Props) => {
  const uri = usePostImageUrl(imageUrl);

  return (
    <View style={style}>
      <AppImage
        source={uri ? { uri } : undefined}
        style={[styles.photo, { aspectRatio: photoAspectRatio }]}
        accessibilityIgnoresInvertColors
        onLoad={
          onNaturalSize
            ? (event) => onNaturalSize(event.source.width, event.source.height)
            : undefined
        }
      />
      {credit ? (
        <ThemedText style={styles.credit} numberOfLines={1}>
          {credit}
        </ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
  },
  credit: {
    ...Typography.scale.caption,
    color: Colors.inkSoft,
    marginTop: Layout.padding.xs,
  },
});
