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
  // BRAND §9: fields are ruled lines on the page by default (hairline
  // underline, no box). Pass `boxed` inside sheets/modals on `paper`, or for
  // tall multiline bodies where an underline reads as a stray rule.
  boxed?: boolean;
};

const FormFieldComponent = (
  { label, error, helperText, boxed = false, style, ...props }: FormFieldProps,
  ref: ForwardedRef<TextInput>,
) => {
  return (
    <View style={styles.wrapper}>
      <ThemedText variant="uiStrong" style={styles.label}>
        {label}
      </ThemedText>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          boxed ? styles.inputBoxed : styles.inputRuled,
          error ? (boxed ? styles.boxedError : styles.ruledError) : null,
          style as InputStyle,
        ]}
        placeholderTextColor={Colors.inkMuted}
        selectionColor={Colors.vermilion}
        {...props}
      />
      {error ? (
        <ThemedText variant="ui" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : helperText ? (
        <ThemedText variant="ui" style={styles.helperText}>
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
    paddingVertical: Layout.input.paddingV,
    color: Colors.ink,
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.body,
  },
  // The default: a ruled line on the page (BRAND §9) — the writing sits on
  // the rule like a form filled in by hand.
  inputRuled: {
    paddingHorizontal: 0,
    borderBottomWidth: Layout.rule.hairline,
    borderBottomColor: Colors.hairline,
    backgroundColor: 'transparent',
  },
  inputBoxed: {
    borderRadius: Layout.borderRadius.md,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper,
    paddingHorizontal: Layout.padding.md,
  },
  ruledError: {
    borderBottomColor: Colors.error,
  },
  boxedError: {
    borderColor: Colors.error,
  },
  helperText: {
    color: Colors.inkSoft,
  },
  errorText: {
    color: Colors.error,
  },
});
