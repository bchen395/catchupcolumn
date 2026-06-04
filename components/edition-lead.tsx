import { Pressable, StyleSheet } from 'react-native';

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

// The front-page lead: the edition's most visual story, given the most room. A
// taped photo (when there is one), a "lead story" kicker, a heavy headline, the
// byline, and a deck pulled from the opening of the post. The whole block is
// the tap target into the story reader.
export const EditionLead = ({ post, onPress }: Props) => {
  const headline = headlineFor(post);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Read the lead story, ${headline}, by ${post.author.display_name}`}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      {post.image_url ? (
        <Polaroid
          imageUrl={post.image_url}
          rotate={-1.5}
          caption={post.author.display_name}
          photoAspectRatio={4 / 3}
          style={styles.photo}
        />
      ) : null}

      <ThemedText style={styles.kicker}>LEAD STORY</ThemedText>
      <ThemedText style={styles.headline}>{headline}</ThemedText>
      <ThemedText style={styles.byline}>By {post.author.display_name}</ThemedText>
      <ThemedText style={styles.deck}>{deckFor(post, 180)}</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.lg,
    paddingBottom: Layout.padding.lg,
    gap: Layout.padding.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  // Extra bottom room so the tilted frame's shadow has space before the text.
  photo: {
    marginBottom: Layout.padding.md,
  },
  kicker: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    color: Colors.orange,
  },
  headline: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.headline,
    lineHeight: Typography.lineHeights.headline,
    color: Colors.ink,
  },
  byline: {
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.body,
    color: Colors.inkSoft,
  },
  deck: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.read,
    lineHeight: Typography.lineHeights.read,
    color: Colors.ink,
    marginTop: Layout.padding.xs,
  },
});
