import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { usePostImageUrl } from '@/hooks/use-post-image-url';
import type { PostWithAuthor } from '@/types';

import { AppImage } from './app-image';
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

// A "section" in the continuous newspaper. No card chrome. Posts sit directly
// on the paperCream surface; the only separator between them is the
// `OrnamentalRule` rendered by the parent.
//
// Byline = small caps "FROM" kicker over the author's name set in display
// serif, like a newspaper section head. Photo (when present) goes full-width
// with squared corners and a 1px ink hairline — a printed-photo feel.
// Body is set in serif at 17/26 for comfortable long-form reading.
export const EditionPost = ({ post }: Props) => {
  const { author, body, image_url } = post;
  const photoUri = usePostImageUrl(image_url);

  return (
    <View style={styles.section}>
      <View style={styles.byline}>
        {author.avatar_url ? (
          <AppImage source={{ uri: author.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText style={styles.initials}>
              {getInitials(author.display_name)}
            </ThemedText>
          </View>
        )}
        <View style={styles.bylineText}>
          <ThemedText style={styles.bylineKicker}>FROM</ThemedText>
          <ThemedText style={styles.authorName} numberOfLines={2}>
            {author.display_name}
          </ThemedText>
        </View>
      </View>

      {photoUri ? <AppImage source={{ uri: photoUri }} style={styles.photo} /> : null}

      <ThemedText style={styles.body}>{body}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.lg,
    gap: Layout.padding.md,
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
    borderColor: Colors.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.lg,
    color: Colors.navy,
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
  // Full-width photo with squared corners and a thin ink hairline — meant to
  // read as a printed press photo. Bleeds to the section's horizontal padding,
  // not the screen edge, so the right margin still feels like a newspaper page.
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.paperWarm,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  // Reading body. Serif at 17/26 keeps continuity with the masthead while
  // staying within accessible-text guidance from CLAUDE.md (≥16px floor).
  body: {
    fontFamily: Typography.families.serif,
    fontSize: 17,
    lineHeight: 26,
    color: Colors.ink,
  },
});
