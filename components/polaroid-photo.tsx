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
  // Tilt in degrees — a small rotation is what makes it feel pinned to a page
  // rather than placed by a grid. Vary it per use so no two sit at the same
  // angle.
  rotate?: number;
  // Optional handwritten-style caption in the polaroid's chin.
  caption?: string;
  // A bit of "tape" across the top edge. On by default; turn off for thumbs.
  tape?: boolean;
  // Photo aspect ratio inside the frame. Square reads most like a polaroid.
  photoAspectRatio?: number;
  // Reports the image's natural pixel size once loaded — feeds
  // useImageOrientation so parents can adapt layout to portrait/landscape.
  onNaturalSize?: (width: number, height: number) => void;
  // Width (and any layout) for the frame. Parent decides the size.
  style?: StyleProp<ViewStyle>;
};

// A printed photo: white border, a chin at the bottom, a warm drop shadow, and
// a slight rotation. Used at full width for the lead story, small for briefs,
// and inline in the story reader.
export const Polaroid = ({
  imageUrl,
  rotate = -2,
  caption,
  tape = true,
  photoAspectRatio = 1,
  onNaturalSize,
  style,
}: Props) => {
  const uri = usePostImageUrl(imageUrl);

  return (
    <View style={[styles.wrap, { transform: [{ rotate: `${rotate}deg` }] }, style]}>
      {tape ? <View style={styles.tape} /> : null}
      <View style={styles.frame}>
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
        {caption ? (
          <ThemedText style={styles.caption} numberOfLines={1}>
            {caption}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    ...Layout.shadow.paper,
    width: '100%',
  },
  // Masking-tape strip across the top edge — translucent warm paper, tilted
  // against the frame so it reads as a real piece of tape.
  tape: {
    position: 'absolute',
    top: -9,
    left: '50%',
    width: 58,
    height: 20,
    backgroundColor: 'rgba(250,247,242,0.7)',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    transform: [{ translateX: -29 }, { rotate: '-4deg' }],
    zIndex: 2,
  },
  frame: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Layout.borderRadius.sm,
    paddingTop: Layout.padding.sm,
    paddingHorizontal: Layout.padding.sm,
    // Deeper chin at the bottom — the signature of a printed photo.
    paddingBottom: Layout.padding.md,
  },
  photo: {
    width: '100%',
    backgroundColor: Colors.peachWash,
  },
  caption: {
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.sm,
    color: Colors.inkSoft,
    textAlign: 'center',
    marginTop: Layout.padding.sm,
  },
});
