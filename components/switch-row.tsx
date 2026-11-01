import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Haptics } from '@/lib/haptics';

type SwitchRowProps = {
  label: string;
  // One plain sentence saying what "on" means.
  helper?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  // A change is saving: taps are ignored until it lands. The switch isn't
  // dimmed for it — a save is a blink, and a grey flash would read as broken.
  busy?: boolean;
};

// A setting that is on or off (BRAND §9 → Switches). The whole row is the
// target; the switch only shows the state, so it takes no touches of its own
// and is hidden from screen readers, which hear the row as one switch. Ink
// when on, a hairline track when off, a paper thumb — never vermilion, never
// the platform green. No confirm dialog: flipping it back is the undo.
export const SwitchRow = ({ label, helper, value, onValueChange, busy = false }: SwitchRowProps) => (
  <Pressable
    onPress={() => {
      Haptics.select();
      onValueChange(!value);
    }}
    disabled={busy}
    accessibilityRole="switch"
    accessibilityLabel={label}
    accessibilityHint={helper}
    accessibilityState={{ checked: value, busy }}
    style={styles.row}
  >
    <View style={styles.text}>
      <ThemedText variant="ui">{label}</ThemedText>
      {helper ? (
        <ThemedText variant="ui" style={styles.helper}>
          {helper}
        </ThemedText>
      ) : null}
    </View>
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Switch
        value={value}
        trackColor={{ false: Colors.hairline, true: Colors.ink }}
        ios_backgroundColor={Colors.hairline}
        thumbColor={Colors.paper}
      />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    minHeight: Layout.rowMinHeight,
    paddingVertical: Layout.padding.sm,
  },
  text: {
    flex: 1,
    gap: Layout.padding.xs,
  },
  // Quiet by color, never by size: the 16px floor holds.
  helper: {
    color: Colors.inkSoft,
  },
});
