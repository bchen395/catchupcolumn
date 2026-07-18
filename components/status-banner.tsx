import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

type StatusVariant = 'error' | 'success' | 'info';

type StatusBannerProps = {
  message: string;
  variant?: StatusVariant;
  // Small-caps lead-in above the message; defaults per variant from Strings.
  kicker?: string;
  style?: ViewStyle;
};

// Text-first on a hairline-ruled band (BRAND §9): a kicker + one Jost line,
// no icons, no tinted background slabs. The kicker color is the voice —
// info speaks in ink, errors in the error color. `success` has no color of
// its own (decided 2026-07-17): it wears the info dress and lets the warm
// words carry it; true celebrations belong to the stamp system (§11).
const KICKER_COLOR: Record<StatusVariant, string> = {
  error: Colors.error,
  success: Colors.ink,
  info: Colors.ink,
};

export const StatusBanner = ({ message, variant = 'info', kicker, style }: StatusBannerProps) => {
  return (
    <View style={[styles.band, style]}>
      <ThemedText variant="kicker" style={{ color: KICKER_COLOR[variant] }}>
        {kicker ?? Strings.banner[variant]}
      </ThemedText>
      <ThemedText variant="ui" style={styles.message}>
        {message}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  band: {
    borderTopWidth: Layout.rule.hairline,
    borderBottomWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    paddingVertical: Layout.padding.md,
    gap: Layout.padding.xs,
  },
  message: {
    color: Colors.ink,
  },
});
