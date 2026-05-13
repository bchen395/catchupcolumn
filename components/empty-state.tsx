import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import type { IconDescriptor } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';

import { Icon } from './icon';
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
          <Icon icon={icon} size={36} color={Colors.orange} />
        </View>
      ) : null}
      <ThemedText style={styles.title}>{title}</ThemedText>
      {body ? <ThemedText style={styles.body}>{body}</ThemedText> : null}
      {ctaLabel && onCtaPress ? (
        <Pressable
          onPress={onCtaPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
        >
          <ThemedText style={styles.ctaText}>{ctaLabel}</ThemedText>
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
    backgroundColor: Colors.paperWarm,
  },
  // The icon bubble matches the new "blue chip" pill language used on Home /
  // Inbox so empty states feel like the same family of UI, not a separate
  // legacy shell.
  iconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.peach + '66',
    marginBottom: Layout.padding.sm,
  },
  title: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xxl,
    lineHeight: 32,
    color: Colors.ink,
    textAlign: 'center',
  },
  body: {
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.body,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  cta: {
    minHeight: Layout.touchTargetMin + 4,
    paddingHorizontal: Layout.padding.lg,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.padding.md,
    backgroundColor: Colors.orange,
  },
  ctaPressed: {
    backgroundColor: Colors.orange + 'CC',
  },
  ctaText: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.body,
    color: Colors.paper,
  },
});
