import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Icons, type IconDescriptor } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

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

// The error twin of EmptyState: same v2 shell (Lora Bold headline, Jost body,
// one ink-pill action). The icon speaks in the error color — the one signal
// that something's wrong; the shell itself never turns alarming.
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
      <Icon icon={icon} size={36} color={Colors.error} />
      <ThemedText variant="title" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText variant="ui" style={styles.body}>
        {body}
      </ThemedText>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
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
