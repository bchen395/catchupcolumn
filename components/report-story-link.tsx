import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { useAuth } from '@/hooks/use-auth';
import { Haptics } from '@/lib/haptics';
import type { PostWithAuthor } from '@/types';

import { ReportStorySheet } from './report-story-sheet';
import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
};

// The report affordance, sitting at the foot of a story like a paper's
// correction notice. Kept quiet by color and placement rather than by size —
// at 16px it still clears the reading floor for the older-adult audience
// (BRAND §3), and it never spends the vermilion accent (§2): reporting is a
// rare, sober action, not a live moment. It opens the report sheet, which
// sends from inside the app.
export const ReportStoryLink = ({ post }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Nothing to report on your own writing — offering it there reads as an
  // invitation to flag yourself.
  if (user?.id === post.author_id) return null;

  const handlePress = () => {
    Haptics.tap();
    setOpen(true);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={Strings.report.link}
        accessibilityHint={Strings.report.linkHint}
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <ThemedText variant="ui" style={styles.label}>
          {Strings.report.link}
        </ThemedText>
      </Pressable>
      <ReportStorySheet post={post} visible={open} onClose={() => setOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: Layout.padding.lg,
    borderTopWidth: Layout.rule.hairline,
    borderTopColor: Colors.hairline,
  },
  button: {
    minHeight: Layout.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    color: Colors.inkSoft,
  },
});
