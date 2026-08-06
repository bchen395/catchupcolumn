import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { useAuth } from '@/hooks/use-auth';
import { Haptics } from '@/lib/haptics';
import { openPostReport } from '@/lib/report';
import type { PostWithAuthor } from '@/types';

import { ThemedText } from './themed-text';

type Props = {
  post: PostWithAuthor;
};

// The report affordance, sitting at the foot of a story like a paper's
// correction notice. Kept quiet by color and placement rather than by size —
// at 16px it still clears the reading floor for the older-adult audience
// (BRAND §3), and it never spends the vermilion accent (§2): reporting is a
// rare, sober action, not a live moment.
export const ReportStoryLink = ({ post }: Props) => {
  const { user } = useAuth();

  // Nothing to report on your own writing — offering it there reads as an
  // invitation to flag yourself.
  if (user?.id === post.author_id) return null;

  const handlePress = () => {
    Haptics.tap();
    Alert.alert(Strings.report.confirmTitle, Strings.report.confirmBody, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: Strings.report.confirmCta,
        onPress: async () => {
          const opened = await openPostReport(post, user?.id ?? null);
          if (!opened) {
            Alert.alert(
              Strings.report.noMailTitle,
              Strings.report.noMailBody(Strings.legal.supportEmail),
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={Strings.report.link}
        accessibilityHint="Opens an email to our team about this story"
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <ThemedText variant="ui" style={styles.label}>
          {Strings.report.link}
        </ThemedText>
      </Pressable>
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
