import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { firstName, headlineFor } from '@/lib/edition-layout';
import { postBlocksOf } from '@/lib/post-blocks';
import type { PostWithAuthor } from '@/types';

import { Avatar } from './avatar';
import { ReportStoryLink } from './report-story-link';
import { StoryBlocks } from './story-blocks';
import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
};

// One contributor's full story, as read in the reader. Headline (the post's
// title or a warm byline fallback), an avatar byline, then the post itself:
// its writing and up to four photos in the order they were set, the first
// photo credited and the first text piece opening on a raised initial
// (StoryBlocks). Posts from before multi-photo read as they always did —
// their one photo above the text.
export const StoryArticle = ({ post }: Props) => {
  const { author } = post;

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

      <StoryBlocks
        blocks={postBlocksOf(post)}
        credit={`Photo by ${firstName(author.display_name)}`}
      />

      <ReportStoryLink post={post} />
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
    ...Typography.scale.headline,
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
    ...Typography.scale.meta,
    color: Colors.inkSoft,
  },
  authorName: {
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.xl,
    lineHeight: 28,
    color: Colors.ink,
  },
});
