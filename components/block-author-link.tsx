import { useState } from 'react';
import { AccessibilityInfo, Alert, StyleSheet } from 'react-native';

import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { blockMember } from '@/lib/blocks';
import { firstName } from '@/lib/edition-layout';
import { Haptics } from '@/lib/haptics';
import type { PostWithAuthor } from '@/types';

import { useEditionViewer } from './edition-viewer-context';
import { StatusBanner } from './status-banner';
import { StoryFootLink } from './story-foot-link';

type Props = {
  post: PostWithAuthor;
};

// "Block {first}" (BRAND §9 → Moderation affordances): a line at the foot of
// anyone else's story. Quiet `inkSoft`, like Report, not `error`: it hides
// their stories from you and Unblock brings them back, so nothing is
// destroyed. The confirmation says what it does and that they won't be told.
// Once blocked, the screen drops every story of theirs and reloads
// (EditionViewer.onAuthorBlocked).
export const BlockAuthorLink = ({ post }: Props) => {
  const { viewerId, onAuthorBlocked } = useEditionViewer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Outside an edition screen there's nobody to block on behalf of.
  if (!viewerId || viewerId === post.author_id) return null;

  const name = firstName(post.author.display_name);

  const block = async () => {
    setError('');
    setBusy(true);
    try {
      await blockMember(viewerId, post.author_id);
    } catch (_err) {
      setBusy(false);
      setError(Strings.block.failed);
      AccessibilityInfo.announceForAccessibility(Strings.block.failed);
      return;
    }
    // No state after this: the screen is about to unmount the story.
    AccessibilityInfo.announceForAccessibility(Strings.block.done(name));
    onAuthorBlocked(post.author_id);
  };

  const confirm = () => {
    Haptics.tap();
    Alert.alert(Strings.block.title(name), Strings.block.body(name), [
      { text: Strings.block.cancel, style: 'cancel' },
      { text: Strings.block.confirm, onPress: () => void block() },
    ]);
  };

  return (
    <>
      <StoryFootLink
        label={Strings.block.link(name)}
        accessibilityHint={Strings.block.linkHint}
        onPress={confirm}
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
