import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Layout } from '@/constants/layout';

type StatusVariant = 'error' | 'success' | 'info';

type StatusBannerProps = {
  message: string;
  variant?: StatusVariant;
  style?: ViewStyle;
};

export const StatusBanner = ({ message, variant = 'info', style }: StatusBannerProps) => {
  return (
    <View style={[styles.container, toneStyles[variant], style]}>
      <ThemedText variant="body" style={textStyles[variant]}>
        {message}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.md,
  },
});

const toneStyles = StyleSheet.create({
  error: {
    backgroundColor: '#FCE8E6',
  },
  success: {
    backgroundColor: '#E8F5E9',
  },
  info: {
    backgroundColor: '#EAF2F6',
  },
});

const textStyles = StyleSheet.create({
  error: {
    color: '#8B1E1E',
  },
  success: {
    color: '#1F5F3D',
  },
  info: {
    color: '#1B3A4B',
  },
});