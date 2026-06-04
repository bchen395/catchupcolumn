import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { headlineFor } from '@/lib/edition-layout';
import type { PostWithAuthor } from '@/types';

import { AppImage } from './app-image';
import { Polaroid } from './polaroid-photo';
import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

// One contributor's full story, as read in the reader. Headline (the post's
// title or a warm byline fallback), an avatar byline, the taped photo when
// present, then the body set for long-form reading with a raised initial.
//
// The raised initial is an inline "lettrine", not a true CSS-float drop cap
// (React Native has no float). It reads as the same flourish without risking a
// clipped glyph. Skipped when the body opens on punctuation/whitespace.
export const StoryArticle = ({ post }: Props) => {
  const { author, body, image_url } = post;

  const trimmed = body.trimStart();
  const firstChar = trimmed.charAt(0);
  const showCap = firstChar !== '' && !/[\s"'“”‘’(){}[\].,!?;:—–-]/.test(firstChar);
  const initial = showCap ? firstChar : '';
  const rest = showCap ? trimmed.slice(1) : body;

  return (
    <View style={styles.article}>
      <ThemedText style={styles.headline}>{headlineFor(post)}</ThemedText>

      <View style={styles.byline}>
        {author.avatar_url ? (
          <AppImage source={{ uri: author.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText style={styles.initials}>{getInitials(author.display_name)}</ThemedText>
          </View>
        )}
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
          photoAspectRatio={4 / 3}
          style={styles.photo}
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: Colors.paperWarm,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.lg,
    color: Colors.orange,
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
