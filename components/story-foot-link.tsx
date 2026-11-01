import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

import { ThemedText } from './themed-text';

type Props = {
  label: string;
  accessibilityHint?: string;
  onPress: () => void;
  // Speaks in `error`: an action that destroys something (Take down).
  destructive?: boolean;
  // The action is running: its own spinner stands in for the label (BRAND
  // §10, a button-scoped wait) and it can't be pressed again.
  busy?: boolean;
};

// One line at the foot of a story (BRAND §9 → Moderation affordances): quiet
// text, never a button, kept quiet by color and placement rather than by
// size — `ui` at 16px still clears the reading floor, and the 48px row is
// the touch target. Never vermilion: these are sober actions, not live
// moments (§2). Report, Take down, and whatever comes next all use it, so
// the foot reads as one set of notices.
export const StoryFootLink = ({ label, accessibilityHint, onPress, destructive, busy }: Props) => (
  <Pressable
    onPress={onPress}
    disabled={busy}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={accessibilityHint}
    accessibilityState={{ busy: !!busy, disabled: !!busy }}
    hitSlop={8}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}
  >
    {busy ? (
      <ActivityIndicator color={Colors.inkSoft} />
    ) : (
      <ThemedText variant="ui" style={destructive ? styles.destructive : styles.label}>
        {label}
      </ThemedText>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
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
  destructive: {
    color: Colors.error,
  },
});
