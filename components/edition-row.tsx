import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { usePostImageUrl } from '@/hooks/use-post-image-url';

import { AppImage } from './app-image';
import { ThemedText } from './themed-text';

type Props = {
  /** The edition's lead-story headline, or the "week of" date as a fallback. */
  headline: string;
  /** `FEB 9 · 6 STORIES · 4 WRITERS` — the row's folio line. */
  folio: string;
  /**
   * Raw `posts.image_url` of the lead story (a private storage path), or null.
   * Signed here rather than by the caller: `post-images` is a private bucket,
   * so handing the stored path straight to an <Image> renders nothing.
   */
  leadImageUrl: string | null;
  onPress: () => void;
};

// One edition in the Editions list (BRAND §6): hairline-separated, headline
// left, square lead-photo thumbnail right, no chevron, whole row is the
// target. Memoised so a list re-render doesn't re-sign every thumbnail.
export const EditionRow = memo(({ headline, folio, leadImageUrl, onPress }: Props) => {
  const thumbUri = usePostImageUrl(leadImageUrl);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${headline}. ${folio}`}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.rowContent}>
        <ThemedText variant="rowTitle" numberOfLines={2}>
          {headline}
        </ThemedText>
        <ThemedText variant="meta" numberOfLines={1}>
          {folio}
        </ThemedText>
      </View>
      {leadImageUrl ? (
        <AppImage
          source={thumbUri ? { uri: thumbUri } : undefined}
          style={styles.rowThumb}
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </Pressable>
  );
});

EditionRow.displayName = 'EditionRow';

const styles = StyleSheet.create({
  row: {
    minHeight: Layout.rowMinHeight,
    paddingVertical: Layout.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  rowPressed: {
    // Content blocks press at ~0.7 opacity — no new colors (BRAND §10).
    opacity: 0.7,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  // Lead photos take the square, hairline-edged treatment (BRAND §5) — round
  // shapes stay reserved for byline avatars.
  rowThumb: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
});
