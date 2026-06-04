import type { ComponentProps, ForwardedRef } from 'react';
import { forwardRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';

type InputStyle = ComponentProps<typeof TextInput>['style'];

type FormFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string | null;
  helperText?: string;
};

const FormFieldComponent = (
  { label, error, helperText, style, ...props }: FormFieldProps,
  ref: ForwardedRef<TextInput>,
) => {
  return (
    <View style={styles.wrapper}>
      <ThemedText variant="label" style={styles.label}>
        {label}
      </ThemedText>
      <TextInput
        ref={ref}
        style={[styles.input, error ? styles.inputError : null, style as InputStyle]}
        placeholderTextColor={Colors.inkSoft}
        selectionColor={Colors.orange}
        {...props}
      />
      {error ? (
        <ThemedText variant="caption" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : helperText ? (
        <ThemedText variant="caption" style={styles.helperText}>
          {helperText}
        </ThemedText>
      ) : null}
    </View>
  );
};

export const FormField = forwardRef(FormFieldComponent);

FormField.displayName = 'FormField';

const styles = StyleSheet.create({
  wrapper: {
    gap: Layout.padding.sm,
  },
  label: {
    color: Colors.ink,
  },
  input: {
    minHeight: Layout.touchTargetMin,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.paper,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.input.paddingV,
    color: Colors.ink,
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.body,
  },
  inputError: {
    borderColor: Colors.error,
  },
  helperText: {
    color: Colors.inkSoft,
  },
  errorText: {
    color: Colors.error,
  },
});