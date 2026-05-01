import { Image, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import type { PostWithAuthor } from '@/types';

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

export const EditionPost = ({ post }: Props) => {
  const { author, body, image_url } = post;

  return (
    <View style={styles.section}>
      <View style={styles.byline}>
        {author.avatar_url ? (
          <Image source={{ uri: author.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText variant="caption" style={styles.initials}>
              {getInitials(author.display_name)}
            </ThemedText>
          </View>
        )}
        <View style={styles.bylineText}>
          <ThemedText variant="label" style={styles.bylineLabel}>
            From
          </ThemedText>
          <ThemedText variant="subheadline" style={styles.authorName}>
            {author.display_name}
          </ThemedText>
        </View>
      </View>

      {image_url ? (
        <Image source={{ uri: image_url }} style={styles.photo} resizeMode="cover" />
      ) : null}

      <ThemedText variant="serifBody" style={styles.body}>
        {body}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.lg,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: Layout.padding.md,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.accentNavy,
    fontFamily: Typography.families.sansBold,
  },
  bylineText: {
    gap: 2,
  },
  bylineLabel: {
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  authorName: {
    color: Colors.text,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.backgroundWarm,
  },
  body: {
    color: Colors.text,
  },
});
