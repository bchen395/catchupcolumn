import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Icons, type IconDescriptor } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

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
        <FontAwesome name={icon.name} size={28} color={Colors.error} />
      </View>
      <ThemedText variant="subheadline" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText variant="body" style={styles.body}>
        {body}
      </ThemedText>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.accent,
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
