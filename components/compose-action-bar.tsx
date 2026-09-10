import { StyleSheet, View } from 'react-native';

import { FormButton } from '@/components/form-button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';

type ComposeActionBarProps = {
  // "Add a photo" / "Change photo" — always labeled, never icon-only.
  photoLabel: string;
  onPickPhoto: () => void;
  // Quiet reassurance between the two actions: "Saving…", "Saved",
  // "Filed for Sunday's edition", or the autosave error. Empty hides it.
  statusText: string;
  statusTone?: 'quiet' | 'error';
  // "File my story" / "Update my story".
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  disabled?: boolean;
};

// The composer's pinned action bar (2026-07-18 redesign): while writing, the
// photo and the finishing action stay one thumb-tap away — the bar rides the
// keyboard and rests above the tab bar when it's down. Paper over a hairline
// top rule, the same dress as the sheets and tab bar it sits among.
export const ComposeActionBar = ({
  photoLabel,
  onPickPhoto,
  statusText,
  statusTone = 'quiet',
  primaryLabel,
  onPrimary,
  primaryLoading = false,
  disabled = false,
}: ComposeActionBarProps) => {
  return (
    <View style={styles.bar}>
      <FormButton
        title={photoLabel}
        variant="ghost"
        onPress={onPickPhoto}
        disabled={disabled}
        accessory={<Icon icon={Icons.photo} size={20} color={Colors.ink} />}
        style={styles.photoButton}
      />
      <ThemedText
        variant="meta"
        numberOfLines={2}
        accessibilityLiveRegion="polite"
        style={[styles.status, statusTone === 'error' && styles.statusError]}
      >
        {statusText}
      </ThemedText>
      <FormButton
        title={primaryLabel}
        onPress={onPrimary}
        loading={primaryLoading}
        disabled={disabled}
        style={styles.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    backgroundColor: Colors.paper,
    borderTopWidth: Layout.rule.hairline,
    borderTopColor: Colors.hairline,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.sm,
  },
  // The breathing room between the actions; right-aligned so it reads as a
  // note attached to the finishing button.
  status: {
    flex: 1,
    textAlign: 'right',
  },
  statusError: {
    color: Colors.error,
  },
  // The ghost variant self-aligns flex-start for form layouts; in the bar's
  // row it should sit on the shared centerline.
  photoButton: {
    alignSelf: 'center',
  },
  // Don't let the pill stretch to the row's ghost-button height rhythm.
  primary: {
    flexGrow: 0,
  },
});
