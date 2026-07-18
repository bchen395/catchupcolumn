import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Haptics } from '@/lib/haptics';

type FormButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type FormButtonProps = {
  title: string;
  onPress: () => void;
  variant?: FormButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const FormButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessory,
  style,
}: FormButtonProps) => {
  const inactive = disabled || loading;

  // Filled buttons (primary/destructive) are the screen's key actions and get
  // a light tap; secondary/ghost are quieter affordances and stay silent so
  // the tactile layer keeps a hierarchy too.
  const handlePress = () => {
    if (variant === 'primary' || variant === 'destructive') Haptics.tap();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !inactive ? styles.pressed : null,
        inactive ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColors[variant]} />
      ) : (
        <>
          {accessory}
          <ThemedText variant="label" style={textStyles[variant]}>
            {title}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
};

// BRAND §9: primary = ink-filled pill, secondary = hairline-outlined pill,
// ghost = bare ink text (tertiary). Vermilion never fills a button.
// Destructive isn't in the v2 spec; it wears the secondary (outlined) shape
// with the `error` voice on the label so danger reads in words, not a slab.
const styles = StyleSheet.create({
  base: {
    minHeight: Layout.buttonMinHeight,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Layout.padding.sm,
  },
  // Pressed = 92% opacity, no motion (BRAND §9).
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.ink,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
  },
  destructive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
});

const textStyles = StyleSheet.create({
  primary: {
    color: Colors.paper,
  },
  secondary: {
    color: Colors.ink,
  },
  ghost: {
    color: Colors.ink,
  },
  destructive: {
    color: Colors.error,
  },
});

const indicatorColors: Record<FormButtonVariant, string> = {
  primary: Colors.paper,
  secondary: Colors.ink,
  ghost: Colors.ink,
  destructive: Colors.error,
};