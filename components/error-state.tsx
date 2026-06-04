import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Icons, type IconDescriptor } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

import { Icon } from './icon';
import { ThemedText } from './themed-text';

interface ErrorStateProps {
  icon?: IconDescriptor;
  title?: string;
  body?: string;
  ctaLabel?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState = ({
  icon = Icons.errorGeneric,
  title = Strings.error.generic.title,
  body = Strings.error.generic.body,
  ctaLabel = Strings.error.generic.cta,
  onRetry,
  style,
}: ErrorStateProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconBubble}>
        <Icon icon={icon} size={32} color={Colors.error} />
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.body}>{body}</ThemedText>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
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
  // Keep the bubble on the peach wash to match EmptyState. The icon color is
  // what signals "error" (red) without making the whole shell feel alarming.
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.peachWash,
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
    borderRadius: Layout.borderRadius.full,
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
