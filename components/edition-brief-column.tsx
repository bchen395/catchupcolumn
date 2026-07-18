import { Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { deckFor, headlineFor } from '@/lib/edition-layout';
import type { PostWithAuthor } from '@/types';

import { EditorialPhoto } from './editorial-photo';
import { GreekedLines } from './greeked-lines';
import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
  onPress: () => void;
};

// One cell of the "in brief" grid: a small square photo when the post has
// one, then headline, byline, a few lines of newsprint excerpt dissolving
// into greeked lines. No read cue at half-column width; the whole cell is the
// tap target and the headline signals it. The grid owns the column geometry —
// this cell just fills whatever width it's given.
export const EditionBriefColumn = ({ post, onPress }: Props) => {
  const headline = headlineFor(post);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Read ${headline}, by ${post.author.display_name}`}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      {post.image_url ? (
        <EditorialPhoto imageUrl={post.image_url} photoAspectRatio={1} style={styles.thumb} />
      ) : null}
      <ThemedText style={styles.headline} numberOfLines={3}>
        {headline}
      </ThemedText>
      <ThemedText style={styles.byline}>By {post.author.display_name}</ThemedText>
      {/* Newsprint teaser — capped scaling so accessibility sizes don't break
          the two-column grid; full reading is the 17px reader. */}
      <ThemedText style={styles.excerpt} numberOfLines={3} maxFontSizeMultiplier={1.6}>
        {deckFor(post, 110)}
      </ThemedText>
      <GreekedLines lines={2} style={styles.greek} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
    minHeight: Layout.touchTargetMin,
    paddingVertical: Layout.padding.md,
  },
  pressed: {
    opacity: 0.6,
  },
  // A contact-print-sized thumb — kept small so briefs stay text-led.
  thumb: {
    width: '88%',
    maxWidth: 150,
    alignSelf: 'flex-start',
    marginBottom: Layout.padding.sm,
  },
  headline: {
    ...Typography.scale.rowTitle,
    color: Colors.ink,
  },
  // True-italic Lora byline at the 16px floor (BRAND §3).
  byline: {
    fontFamily: Typography.families.serifItalic,
    fontSize: Typography.sizes.body,
    color: Colors.inkSoft,
  },
  excerpt: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.excerpt,
    lineHeight: Typography.lineHeights.excerpt,
    color: Colors.inkSoft,
    marginTop: 2,
  },
  // Half-line of air so the bars sit on the text's rhythm.
  greek: {
    marginTop: 6,
  },
});
