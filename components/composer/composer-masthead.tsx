import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';

type Props = {
  groupName: string;
  subtitle: string;
  // With more than one Group the name is tappable, reopening the "Write
  // for…" sheet to switch.
  onSwitchGroup: (() => void) | null;
};

// Names the publication you're writing for, and when your story runs — so
// writing feels pointed at a real arrival, not dropped into a void.
export const ComposerMasthead = ({ groupName, subtitle, onSwitchGroup }: Props) => (
  <View style={styles.header}>
    {onSwitchGroup ? (
      <Pressable
        onPress={onSwitchGroup}
        accessibilityRole="button"
        accessibilityLabel="Switch Group"
        style={({ pressed }) => [styles.switcher, pressed && styles.pressed]}
      >
        <ThemedText variant="subheadline" style={styles.title} numberOfLines={1}>
          {groupName}
        </ThemedText>
        <Icon icon={Icons.chevronDown} size={14} color={Colors.inkSoft} />
      </Pressable>
    ) : (
      <ThemedText variant="subheadline" style={styles.title}>
        {groupName}
      </ThemedText>
    )}
    <ThemedText variant="caption">{subtitle}</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  header: {
    gap: Layout.padding.xs,
  },
  // Name + down-caret.
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    alignSelf: 'flex-start',
    minHeight: Layout.touchTargetMin,
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    color: Colors.ink,
    flexShrink: 1,
  },
});
