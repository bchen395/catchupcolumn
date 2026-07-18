import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import type { IconDescriptor } from '@/constants/icons';
import { Layout } from '@/constants/layout';

import { Icon } from './icon';
import { ThemedText } from './themed-text';

interface EmptyStateProps {
  // A §4 doodle scene (a components/illustrations component). Wins over
  // `icon`, which remains the quiet fallback for surfaces without a scene.
  scene?: ReactNode;
  icon?: IconDescriptor;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: ViewStyle;
}

// BRAND §9: doodle scene + Lora Bold headline + Jost body + one primary
// action — warm, never apologetic. Scenes sit directly on paperWarm (§4):
// no bubble, no tinted container.
export const EmptyState = ({
  scene,
  icon,
  title,
  body,
  ctaLabel,
  onCtaPress,
  style,
}: EmptyStateProps) => {
  return (
    <View style={[styles.container, style]}>
      {scene ?? (icon ? <Icon icon={icon} size={40} color={Colors.inkSoft} /> : null)}
      <ThemedText variant="title" style={styles.title}>
        {title}
      </ThemedText>
      {body ? (
        <ThemedText variant="ui" style={styles.body}>
          {body}
        </ThemedText>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <Pressable
          onPress={onCtaPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
        >
          <ThemedText variant="uiStrong" style={styles.ctaText}>
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
    backgroundColor: Colors.paperWarm,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  // The one primary action — the §9 ink pill.
  cta: {
    minHeight: Layout.buttonMinHeight,
    paddingHorizontal: Layout.padding.lg,
    borderRadius: Layout.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.padding.md,
    backgroundColor: Colors.ink,
  },
  ctaPressed: {
    opacity: 0.92,
  },
  ctaText: {
    color: Colors.paper,
  },
});
