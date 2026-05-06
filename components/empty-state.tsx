import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import type { IconDescriptor } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';

import { ThemedText } from './themed-text';

interface EmptyStateProps {
  icon?: IconDescriptor;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState = ({ icon, title, body, ctaLabel, onCtaPress, style }: EmptyStateProps) => {
  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <View style={styles.iconBubble}>
          <FontAwesome name={icon.name} size={32} color={Colors.accentNavy} />
        </View>
      ) : null}
      <ThemedText variant="subheadline" style={styles.title}>
        {title}
      </ThemedText>
      {body ? (
        <ThemedText variant="body" style={styles.body}>
          {body}
        </ThemedText>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <Pressable
          onPress={onCtaPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
        >
          <ThemedText variant="label" style={styles.ctaText}>
            {ctaLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.padding.xl,
    paddingVertical: Layout.padding.xl,
    gap: Layout.padding.md,
    backgroundColor: Colors.background,
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.padding.sm,
  },
  title: {
    fontFamily: Typography.families.serifBold,
    color: Colors.text,
    textAlign: 'center',
  },
  body: {
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
  },
  cta: {
    minHeight: Layout.touchTargetMin,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.sm,
    backgroundColor: Colors.accentNavy,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.padding.sm,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    color: Colors.white,
    fontFamily: Typography.families.sansSemiBold,
  },
});
