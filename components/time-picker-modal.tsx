import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';

import {
  AMPM_ITEMS,
  from12hTo24,
  HOURS_12,
  MINUTE_ITEMS,
  SnapColumn,
  to12hIndices,
} from './snap-column';
import { ThemedText } from './themed-text';

const MINUTE_VALUES = [0, 15, 30, 45];

/** "9:05 AM" from a 24-hour value + minute. */
export const formatTime12h = (hour24: number, minute: number): string => {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
};

type TimePickerModalProps = {
  visible: boolean;
  hourIndex: number;
  minuteIndex: number;
  ampmIndex: number;
  onHour: (i: number) => void;
  onMinute: (i: number) => void;
  onAmpm: (i: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  title?: string;
};

// Presentational scroll-wheel time picker. Kept dumb (indices in, callbacks
// out) so the seeding/anchoring logic lives in one place — TimeField below.
const TimePickerModal = ({
  visible,
  hourIndex,
  minuteIndex,
  ampmIndex,
  onHour,
  onMinute,
  onAmpm,
  onConfirm,
  onClose,
  title = 'Publish time',
}: TimePickerModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <ThemedText variant="label" style={styles.modalTitle}>
            {title}
          </ThemedText>
          <View style={styles.modalColumns}>
            <SnapColumn data={HOURS_12} selectedIndex={hourIndex} onSelect={onHour} visible={visible} />
            <ThemedText variant="body" style={styles.colonSeparator}>
              :
            </ThemedText>
            <SnapColumn
              data={MINUTE_ITEMS}
              selectedIndex={minuteIndex}
              onSelect={onMinute}
              visible={visible}
              width={64}
            />
            <SnapColumn
              data={AMPM_ITEMS}
              selectedIndex={ampmIndex}
              onSelect={onAmpm}
              visible={visible}
              width={64}
            />
          </View>
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalActionButton} accessibilityRole="button">
              <ThemedText variant="body" style={styles.cancelText}>
                Cancel
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.modalActionButton, styles.doneButton]}
              accessibilityRole="button"
            >
              <ThemedText variant="body" style={styles.doneText}>
                Done
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

type TimeFieldProps = {
  /** Current time as a 24-hour value + minute. */
  hour24: number;
  minute: number;
  onChange: (hour24: number, minute: number) => void;
  label?: string;
};

// A labeled "Publish time" button that opens the scroll-wheel picker. Owns the
// open + temp-index state and seeds the wheels from the current value *before*
// opening, so SnapColumn anchors to the right row on first paint.
export const TimeField = ({ hour24, minute, onChange, label = 'Publish time' }: TimeFieldProps) => {
  const [open, setOpen] = useState(false);
  const [hourIndex, setHourIndex] = useState(0);
  const [minuteIndex, setMinuteIndex] = useState(0);
  const [ampmIndex, setAmpmIndex] = useState(0);

  const openPicker = () => {
    const idx = to12hIndices(hour24, minute);
    setHourIndex(idx.hourIndex);
    setMinuteIndex(idx.minuteIndex);
    setAmpmIndex(idx.ampmIndex);
    setOpen(true);
  };

  const confirm = () => {
    onChange(from12hTo24(hourIndex, ampmIndex), MINUTE_VALUES[minuteIndex]);
    setOpen(false);
  };

  return (
    <View style={styles.fieldWrapper}>
      <ThemedText variant="label" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <Pressable onPress={openPicker} style={styles.timeButton} accessibilityRole="button">
        <ThemedText variant="body">{formatTime12h(hour24, minute)}</ThemedText>
      </Pressable>
      <TimePickerModal
        visible={open}
        hourIndex={hourIndex}
        minuteIndex={minuteIndex}
        ampmIndex={ampmIndex}
        onHour={setHourIndex}
        onMinute={setMinuteIndex}
        onAmpm={setAmpmIndex}
        onConfirm={confirm}
        onClose={() => setOpen(false)}
      />
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
  timeButton: {
    minHeight: Layout.touchTargetMin,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.paper,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.input.paddingV,
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: Colors.paperWarm,
    borderRadius: Layout.borderRadius.xl,
    width: '100%',
    maxWidth: 320,
    marginHorizontal: Layout.padding.lg,
    padding: Layout.padding.lg,
    gap: Layout.padding.md,
  },
  modalTitle: {
    color: Colors.orange,
    textAlign: 'center',
  },
  modalColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.padding.xs,
  },
  colonSeparator: {
    fontFamily: Typography.families.sansSemiBold,
    color: Colors.inkSoft,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.padding.md,
    marginTop: Layout.padding.xs,
  },
  modalActionButton: {
    minHeight: Layout.touchTargetMin,
    paddingHorizontal: Layout.padding.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.borderRadius.md,
  },
  doneButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Layout.padding.lg,
  },
  cancelText: {
    color: Colors.inkSoft,
  },
  doneText: {
    color: Colors.paper,
    fontFamily: Typography.families.sansSemiBold,
  },
});
