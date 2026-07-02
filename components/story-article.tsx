import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { displayRatioFor, useImageOrientation } from '@/hooks/use-image-orientation';
import { headlineFor } from '@/lib/edition-layout';
import type { PostWithAuthor } from '@/types';

import { Avatar } from './avatar';
import { Polaroid } from './polaroid-photo';
import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
};

// One contributor's full story, as read in the reader. Headline (the post's
// title or a warm byline fallback), an avatar byline, the taped photo when
// present, then the body set for long-form reading with a raised initial.
//
// The raised initial is an inline "lettrine", not a true CSS-float drop cap
// (React Native has no float). It reads as the same flourish without risking a
// clipped glyph. Skipped when the body opens on punctuation/whitespace.
export const StoryArticle = ({ post }: Props) => {
  const { author, body, image_url } = post;
  const { orientation, onNaturalSize } = useImageOrientation(image_url);

  const trimmed = body.trimStart();
  const firstChar = trimmed.charAt(0);
  const showCap = firstChar !== '' && !/[\s"'“”‘’(){}[\].,!?;:—–-]/.test(firstChar);
  const initial = showCap ? firstChar : '';
  const rest = showCap ? trimmed.slice(1) : body;

  return (
    <View style={styles.article}>
      <ThemedText style={styles.headline}>{headlineFor(post)}</ThemedText>

      <View style={styles.byline}>
        <Avatar uri={author.avatar_url} name={author.display_name} size={48} />
        <View style={styles.bylineText}>
          <ThemedText style={styles.bylineKicker}>BY</ThemedText>
          <ThemedText style={styles.authorName} numberOfLines={2}>
            {author.display_name}
          </ThemedText>
        </View>
      </View>

      {image_url ? (
        <Polaroid
          imageUrl={image_url}
          rotate={1.5}
          caption={author.display_name}
          photoAspectRatio={displayRatioFor(orientation ?? 'landscape')}
          onNaturalSize={onNaturalSize}
          style={[styles.photo, orientation === 'portrait' && styles.photoPortrait]}
        />
      ) : null}

      <ThemedText style={styles.body}>
        {showCap ? <ThemedText style={styles.dropCap}>{initial}</ThemedText> : null}
        {rest}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  article: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.lg,
    gap: Layout.padding.md,
  },
  headline: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.headline,
    lineHeight: Typography.lineHeights.headline,
    color: Colors.ink,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  bylineText: {
    flex: 1,
    gap: 2,
  },
  bylineKicker: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    color: Colors.inkSoft,
  },
  authorName: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xl,
    lineHeight: 28,
    color: Colors.ink,
  },
  // Slightly extra bottom space so the tilted frame's shadow clears the body.
  photo: {
    marginTop: Layout.padding.xs,
    marginBottom: Layout.padding.md,
  },
  // A tall photo at full width would tower over the page — bring it in to a
  // narrower centered measure instead, like a portrait plate in a paper.
  photoPortrait: {
    width: '78%',
    alignSelf: 'center',
  },
  body: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.read,
    lineHeight: Typography.lineHeights.read,
    color: Colors.ink,
  },
  dropCap: {
    fontFamily: Typography.families.serifBlack,
    fontSize: 36,
    lineHeight: 40,
    color: Colors.orange,
  },
});
