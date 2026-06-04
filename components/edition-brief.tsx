import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { deckFor, headlineFor } from '@/lib/edition-layout';
import type { PostWithAuthor } from '@/types';

import { Polaroid } from './polaroid-photo';
import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
  onPress: () => void;
};

// A "brief" below the fold: every other contributor, equal to one another. A
// compact headline + byline + one-line deck, with a small taped thumbnail when
// the post has a photo. Taps into the same story reader as the lead.
export const EditionBrief = ({ post, onPress }: Props) => {
  const headline = headlineFor(post);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Read ${headline}, by ${post.author.display_name}`}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <ThemedText style={styles.headline} numberOfLines={2}>
          {headline}
        </ThemedText>
        <ThemedText style={styles.byline}>By {post.author.display_name}</ThemedText>
        <ThemedText style={styles.deck} numberOfLines={2}>
          {deckFor(post, 120)}
        </ThemedText>
      </View>
      {post.image_url ? (
        <Polaroid
          imageUrl={post.image_url}
          rotate={2.5}
          tape={false}
          photoAspectRatio={1}
          style={styles.thumb}
        />
      ) : null}
    </Pressable>
  );
};

const THUMB = 92;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  headline: {
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.xl,
    lineHeight: 26,
    color: Colors.ink,
  },
  byline: {
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.sm,
    color: Colors.inkSoft,
  },
  deck: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.body,
    lineHeight: 22,
    color: Colors.inkSoft,
    marginTop: 2,
  },
  // Small enough to sit beside two lines of headline; the chin + tilt still
  // read at this size.
  thumb: {
    width: THUMB,
    marginTop: Layout.padding.xs,
  },
});
