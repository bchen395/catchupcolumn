import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

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

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
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

const styles = StyleSheet.create({
  base: {
    minHeight: Layout.touchTargetMin,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Layout.padding.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
  },
  destructive: {
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.error,
  },
});

const textStyles = StyleSheet.create({
  primary: {
    color: Colors.white,
  },
  secondary: {
    color: Colors.text,
  },
  ghost: {
    color: Colors.accentNavy,
  },
  destructive: {
    color: Colors.error,
  },
});

const indicatorColors: Record<FormButtonVariant, string> = {
  primary: Colors.white,
  secondary: Colors.accentNavy,
  ghost: Colors.accentNavy,
  destructive: Colors.error,
};