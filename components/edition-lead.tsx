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

// The front-page lead: kicker, heavy headline, byline, the photo, then a short
// newsprint excerpt that dissolves into greeked lines — the story visibly
// continues in the reader. Landscape and square photos run the full measure
// with the text below; a portrait photo sits in its own column with the text
// running beside it, newspaper-style. The whole block is the tap target.
export const EditionLead = ({ post, onPress }: Props) => {
  const headline = headlineFor(post);
  const { orientation, onNaturalSize } = useImageOrientation(post.image_url);
  // Until the photo reports its shape, lay out as landscape — the common case.
  const portrait = orientation === 'portrait';

  // Newsprint teaser + greeked continuation. Capped scaling so accessibility
  // sizes grow it without blowing up the page; full reading is the 17px reader.
  const teaser = (lines: number) => (
    <>
      <ThemedText style={styles.deck} numberOfLines={lines} maxFontSizeMultiplier={1.6}>
        {deckFor(post, 160)}
      </ThemedText>
      <GreekedLines lines={3} style={styles.greek} />
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Read the lead story, ${headline}, by ${post.author.display_name}`}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <ThemedText style={styles.kicker}>LEAD STORY</ThemedText>
      <ThemedText style={styles.headline}>{headline}</ThemedText>
      <View style={styles.bylineRow}>
        <Avatar uri={post.author.avatar_url} name={post.author.display_name} size={28} />
        <ThemedText style={styles.byline} numberOfLines={2}>By {post.author.display_name}</ThemedText>
      </View>

      {post.image_url && portrait ? (
        // Portrait: the photo holds one column, the teaser runs beside it.
        <View style={styles.sideBySide}>
          <EditorialPhoto
            imageUrl={post.image_url}
            photoAspectRatio={displayRatioFor('portrait')}
            onNaturalSize={onNaturalSize}
            style={styles.portraitPhoto}
          />
          <View style={styles.sideText}>{teaser(8)}</View>
        </View>
      ) : (
        <>
          {post.image_url ? (
            <EditorialPhoto
              imageUrl={post.image_url}
              photoAspectRatio={displayRatioFor(orientation ?? 'landscape')}
              onNaturalSize={onNaturalSize}
              style={styles.photo}
            />
          ) : null}
          {teaser(3)}
        </>
      )}

      <ThemedText style={styles.readCue}>READ THE STORY →</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.lg,
    paddingBottom: Layout.padding.lg,
    gap: Layout.padding.md,
  },
  pressed: {
    opacity: 0.7,
  },
  // Flat editorial photo on the text measure — v2 photos align to the column
  // like a printed plate, no bleed, no tilt (BRAND §5).
  photo: {
    marginTop: Layout.padding.xs,
    marginBottom: Layout.padding.md,
  },
  sideBySide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.padding.md,
    marginTop: Layout.padding.xs,
  },
  portraitPhoto: {
    width: '46%',
  },
  sideText: {
    flex: 1,
    gap: Layout.padding.sm,
  },
  // The front page's one vermilion kicker (BRAND §2 budget) — the lead earns
  // the accent; every other cover label stays ink.
  kicker: {
    ...Typography.scale.kicker,
    color: Colors.vermilion,
  },
  headline: {
    ...Typography.scale.headline,
    color: Colors.ink,
  },
  bylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  // Bylines are the Lora-italic voice (BRAND §3) — a true italic face, since
  // custom fonts don't synthesize fontStyle on native.
  byline: {
    flex: 1,
    fontFamily: Typography.families.serifItalic,
    fontSize: Typography.sizes.body,
    color: Colors.inkSoft,
  },
  deck: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.excerpt,
    lineHeight: Typography.lineHeights.excerpt,
    color: Colors.inkSoft,
  },
  // Half-line of air so the bars sit on the text's rhythm.
  greek: {
    marginTop: 2,
  },
  // An affordance label in the tertiary-button voice: bare ink small caps.
  // Not vermilion — the kicker already spends the lead's accent (BRAND §2).
  readCue: {
    ...Typography.scale.meta,
    color: Colors.ink,
    marginTop: Layout.padding.xs,
  },
});
