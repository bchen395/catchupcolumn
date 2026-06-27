import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { Haptics } from '@/lib/haptics';

import { ThemedText } from './themed-text';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type DaySelectorProps = {
  /** 0 = Sunday … 6 = Saturday */
  value: number;
  onChange: (index: number) => void;
  label?: string;
};

// Seven equal-width day buttons, the selected one filled orange. Shared by the
// create-group and group-settings screens so the picker stays identical in both.
export const DaySelector = ({ value, onChange, label = 'Publish day' }: DaySelectorProps) => {
  return (
    <View style={styles.fieldWrapper}>
      <ThemedText variant="label" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <View style={styles.dayRow}>
        {DAY_LABELS.map((day, index) => {
          const selected = value === index;
          return (
            <Pressable
              key={day}
              onPress={() => {
                // Tick only on an actual change — re-pressing the selected day
                // shouldn't buzz.
                if (!selected) Haptics.select();
                onChange(index);
              }}
              accessibilityRole="button"
              accessibilityLabel={day}
              accessibilityState={selected ? { selected: true } : undefined}
              style={[styles.dayButton, selected ? styles.dayButtonActive : null]}
            >
              <ThemedText
                variant="caption"
                style={[styles.dayButtonText, selected ? styles.dayButtonTextActive : null]}
              >
                {day}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldWrapper: {
    gap: Layout.padding.sm,
  },
  fieldLabel: {
    color: Colors.orange,
  },
  dayRow: {
    flexDirection: 'row',
    gap: Layout.padding.xs,
  },
  dayButton: {
    flex: 1,
    minHeight: Layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.paper,
  },
  dayButtonActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  dayButtonText: {
    color: Colors.inkSoft,
    fontFamily: Typography.families.sansMedium,
  },
  dayButtonTextActive: {
    color: Colors.paper,
  },
});
