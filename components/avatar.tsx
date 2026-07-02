import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

import { AppImage } from './app-image';
import { ThemedText } from './themed-text';

type Props = {
  uri?: string | null;
  // Drives the initials fallback when there's no photo.
  name: string;
  // Diameter in px; the initials scale with it. Defaults to the reader byline.
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

// One contributor's face — or their initials on a warm paper chip when they
// have no avatar. Shared by the reader's `story-article` byline and the
// front-page bylines (lead/secondary) so the two never drift; `size` is the one
// knob that keeps the circle and initials in proportion at every use.
export const Avatar = ({ uri, name, size = 48, style }: Props) => {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    // `style` is typed for the View fallback; the layout props callers pass
    // (size/margins) are valid on an image too, so the cast is safe here.
    return <AppImage source={{ uri }} style={[dimension, style] as StyleProp<ImageStyle>} />;
  }
  return (
    <View style={[dimension, styles.fallback, style]}>
      <ThemedText style={[styles.initials, { fontSize: Math.round(size * 0.4) }]}>
        {getInitials(name)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.paperWarm,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: Typography.families.serifBlack,
    color: Colors.orange,
  },
});
