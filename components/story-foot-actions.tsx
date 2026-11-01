import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import type { PostWithAuthor } from '@/types';

import { useEditionViewer } from './edition-viewer-context';
import { ReportStoryLink } from './report-story-link';
import { TakeDownStoryLink } from './take-down-story-link';

type Props = {
  post: PostWithAuthor;
};

// The foot of a story in the reader: a hairline rule, then one quiet line per
// thing this reader may do about it (BRAND §9 → Moderation affordances),
// stacked and centered — Report for anyone but its author, Take down for the
// Group's moderators. A new action is one more line here, gated the same
// way; each line is a StoryFootLink. With nothing to offer (your own story,
// and you don't run the Group) there is no rule either.
export const StoryFootActions = ({ post }: Props) => {
  const { viewerId, isModerator } = useEditionViewer();

  const canReport = viewerId !== post.author_id;
  if (!canReport && !isModerator) return null;

  return (
    <View style={styles.foot}>
      {canReport ? <ReportStoryLink post={post} /> : null}
      {isModerator ? <TakeDownStoryLink post={post} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  foot: {
    marginTop: Layout.padding.lg,
    borderTopWidth: Layout.rule.hairline,
    borderTopColor: Colors.hairline,
  },
});
