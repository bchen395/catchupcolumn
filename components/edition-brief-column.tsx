import { Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { deckFor, headlineFor } from '@/lib/edition-layout';
import type { PostWithAuthor } from '@/types';

import { GreekedLines } from './greeked-lines';
import { Polaroid } from './polaroid-photo';
import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
  onPress: () => void;
};

// Small deterministic tilt from the post id — brief thumbs vary in angle (no
// two frames at the same angle, per the brand) without two renders of the
// same cell ever disagreeing (the enlarge overlay re-renders this markup).
const TILTS = [-2.5, -1.5, 1.5, 2.5];
const tiltFor = (id: string) =>
  TILTS[(id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % TILTS.length];

// One cell of the "in brief" grid: a small square photo when the post has one
// (untaped — a contact print, not the lead's pinned polaroid), then headline,
// byline, a few lines of newsprint excerpt dissolving into greeked lines. No
// read cue at half-column width; the whole cell is the tap target and the
// headline signals it. The grid owns the column geometry — this cell just
// fills whatever width it's given.
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
        <Polaroid
          imageUrl={post.image_url}
          rotate={tiltFor(post.id)}
          tape={false}
          photoAspectRatio={1}
          style={styles.thumb}
        />
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
  // Slightly inset from the column edges so the tilt never clips against the
  // grid's vertical rule.
  thumb: {
    width: '88%',
    maxWidth: 150,
    alignSelf: 'flex-start',
    marginBottom: Layout.padding.sm,
  },
  headline: {
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.lg,
    lineHeight: 22,
    color: Colors.ink,
  },
  byline: {
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.sm,
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
