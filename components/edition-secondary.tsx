import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { displayRatioFor, useImageOrientation } from '@/hooks/use-image-orientation';
import { deckFor, headlineFor } from '@/lib/edition-layout';
import type { PostWithAuthor } from '@/types';

import { Avatar } from './avatar';
import { EditorialPhoto } from './editorial-photo';
import { GreekedLines } from './greeked-lines';
import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
  onPress: () => void;
};

// The second story on the front page: mid-weight between the lead and the
// in-brief grid. A landscape/square photo runs full-width above the headline
// (photo-first so its silhouette differs from the lead's headline-first
// block); a portrait photo drops into a column beside the excerpt instead.
// The excerpt dissolves into greeked lines. The whole block is the tap target.
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
        <EditorialPhoto
          imageUrl={post.image_url}
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
          <EditorialPhoto
            imageUrl={post.image_url}
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
  // §3 names `title` for secondary story headlines explicitly.
  headline: {
    ...Typography.scale.title,
    color: Colors.ink,
  },
  bylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  // True-italic Lora byline at the 16px floor (BRAND §3).
  byline: {
    flex: 1,
    fontFamily: Typography.families.serifItalic,
    fontSize: Typography.sizes.body,
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
  // Tertiary-button voice: bare ink small caps. The cover's vermilion budget
  // is spent on the lead's kicker (BRAND §2).
  readCue: {
    ...Typography.scale.meta,
    color: Colors.ink,
    marginTop: Layout.padding.xs,
  },
});
