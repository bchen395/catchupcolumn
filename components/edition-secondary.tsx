import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { displayRatioFor, useImageOrientation } from '@/hooks/use-image-orientation';
import { deckFor, headlineFor } from '@/lib/edition-layout';
import type { PostWithAuthor } from '@/types';

import { Avatar } from './avatar';
import { GreekedLines } from './greeked-lines';
import { Polaroid } from './polaroid-photo';
import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
  onPress: () => void;
};

// The second story on the front page: mid-weight between the lead and the
// in-brief grid. A landscape/square photo runs full-width above the headline
// (tilted opposite the lead so no two frames sit at the same angle, and
// photo-first so its silhouette differs from the lead's headline-first block);
// a portrait photo drops into a column beside the excerpt instead. The excerpt
// dissolves into greeked lines. The whole block is the tap target.
export const EditionSecondary = ({ post, onPress }: Props) => {
  const headline = headlineFor(post);
  const { orientation, onNaturalSize } = useImageOrientation(post.image_url);
  // Until the photo reports its shape, lay out as landscape — the common case.
  const portrait = orientation === 'portrait';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Read ${headline}, by ${post.author.display_name}`}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      {post.image_url && !portrait ? (
        <Polaroid
          imageUrl={post.image_url}
          rotate={1.5}
          photoAspectRatio={displayRatioFor(orientation ?? 'landscape')}
          onNaturalSize={onNaturalSize}
          style={styles.photo}
        />
      ) : null}

      <ThemedText style={styles.headline} numberOfLines={3}>
        {headline}
      </ThemedText>
      <View style={styles.bylineRow}>
        <Avatar uri={post.author.avatar_url} name={post.author.display_name} size={24} />
        <ThemedText style={styles.byline} numberOfLines={2}>By {post.author.display_name}</ThemedText>
      </View>

      {/* Newsprint teaser — capped scaling so accessibility sizes grow it
          without blowing up the page; full reading is the 17px reader. */}
      {post.image_url && portrait ? (
        <View style={styles.sideBySide}>
          <Polaroid
            imageUrl={post.image_url}
            rotate={1.5}
            photoAspectRatio={displayRatioFor('portrait')}
            onNaturalSize={onNaturalSize}
            style={styles.portraitPhoto}
          />
          <View style={styles.sideText}>
            <ThemedText style={styles.excerpt} numberOfLines={6} maxFontSizeMultiplier={1.6}>
              {deckFor(post, 140)}
            </ThemedText>
            <GreekedLines lines={2} style={styles.greek} />
          </View>
        </View>
      ) : (
        <>
          <ThemedText style={styles.excerpt} numberOfLines={2} maxFontSizeMultiplier={1.6}>
            {deckFor(post, 140)}
          </ThemedText>
          <GreekedLines lines={2} style={styles.greek} />
        </>
      )}

      <ThemedText style={styles.readCue}>READ THE STORY →</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.lg,
    gap: Layout.padding.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  // Extra bottom room so the tilted frame's shadow has space before the text.
  photo: {
    marginBottom: Layout.padding.md,
  },
  sideBySide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.padding.md,
    marginTop: Layout.padding.xs,
  },
  portraitPhoto: {
    width: '42%',
  },
  sideText: {
    flex: 1,
    gap: Layout.padding.sm,
  },
  headline: {
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.xxl,
    lineHeight: 32,
    color: Colors.ink,
  },
  bylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  byline: {
    flex: 1,
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
  },
  // Half-line of air so the bars sit on the text's rhythm.
  greek: {
    marginTop: 2,
  },
  // An affordance label, not body copy — orange is allowed here.
  readCue: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 1.5,
    color: Colors.orange,
    marginTop: Layout.padding.xs,
  },
});
