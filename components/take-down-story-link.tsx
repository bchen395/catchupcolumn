import { useState } from 'react';
import { AccessibilityInfo, Alert, StyleSheet } from 'react-native';

import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Haptics } from '@/lib/haptics';
import { takeDownPost } from '@/lib/posts';
import type { PostWithAuthor } from '@/types';

import { useEditionViewer } from './edition-viewer-context';
import { StatusBanner } from './status-banner';
import { StoryFootLink } from './story-foot-link';

type Props = {
  post: PostWithAuthor;
};

// "Take down this story" (BRAND §9 → Moderation affordances): the
// moderator's line at the foot of any story in their Group, their own and
// past editions' included. Quiet text in `error`. The confirmation says what
// can't be undone, and the screen closes the reader and reloads once the
// story is gone (EditionViewer.onStoryRemoved).
export const TakeDownStoryLink = ({ post }: Props) => {
  const { groupName, onStoryRemoved } = useEditionViewer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const takeDown = async () => {
    setError('');
    setBusy(true);
    try {
      await takeDownPost(post.id);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      // post_not_found: already gone — another moderator or its author got
      // there first. That's the outcome asked for, so carry on.
      if (code !== 'post_not_found') {
        const message =
          code === 'not_moderator' ? Strings.takeDown.notModerator : Strings.takeDown.failed;
        setBusy(false);
        setError(message);
        AccessibilityInfo.announceForAccessibility(message);
        return;
      }
    }
    // No state after this: the screen is about to unmount the story.
    AccessibilityInfo.announceForAccessibility(Strings.takeDown.done);
    onStoryRemoved(post.id);
  };

  const confirm = () => {
    Haptics.tap();
    Alert.alert(
      Strings.takeDown.title,
      Strings.takeDown.body(groupName || Strings.takeDown.groupFallback),
      [
        { text: Strings.takeDown.keep, style: 'cancel' },
        { text: Strings.takeDown.confirm, style: 'destructive', onPress: () => void takeDown() },
      ],
    );
  };

  return (
    <>
      <StoryFootLink
        label={Strings.takeDown.link}
        accessibilityHint={Strings.takeDown.linkHint}
        onPress={confirm}
        destructive
        busy={busy}
      />
      {error ? <StatusBanner variant="error" message={error} style={styles.banner} /> : null}
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    alignSelf: 'stretch',
    marginTop: Layout.padding.xs,
  },
});
