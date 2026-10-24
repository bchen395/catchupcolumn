import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Icons, type IconDescriptor } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

import { FormButton } from './form-button';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

interface ErrorStateProps {
  icon?: IconDescriptor;
  title?: string;
  body?: string;
  ctaLabel?: string;
  onRetry?: () => void;
  // The retry is in flight: the CTA shows a spinner and both actions hold.
  busy?: boolean;
  // A quieter way out under the CTA, set as a bare-text button (BRAND §9).
  secondaryLabel?: string;
  onSecondary?: () => void;
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
  busy = false,
  secondaryLabel,
  onSecondary,
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
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
          style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
        >
          {/* The label stays (invisible) under the spinner so the pill keeps
              its width and screen readers keep its name. */}
          <ThemedText variant="uiStrong" style={[styles.ctaText, busy ? styles.hidden : null]}>
            {ctaLabel}
          </ThemedText>
          {busy ? <ActivityIndicator color={Colors.paper} style={StyleSheet.absoluteFill} /> : null}
        </Pressable>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <FormButton
          title={secondaryLabel}
          variant="ghost"
          onPress={onSecondary}
          disabled={busy}
          style={styles.secondary}
        />
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
  hidden: {
    opacity: 0,
  },
  secondary: {
    alignSelf: 'center',
  },
});
