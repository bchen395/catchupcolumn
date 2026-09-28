import { StyleSheet } from 'react-native';

import { FormField } from '@/components/form-field';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { CODE_LENGTH } from '@/hooks/use-email-code';

type CodeFieldProps = {
  value: string;
  // Receives digits only, at most CODE_LENGTH of them.
  onChangeText: (code: string) => void;
  onSubmitEditing: () => void;
  error?: string;
};

// The 6-digit emailed-code input, shared by sign-in, sign-up, and the
// "confirm it's you" step of setting a password. One copy, because it has to
// stay exactly this forgiving everywhere a code is typed.
export const CodeField = ({ value, onChangeText, onSubmitEditing, error }: CodeFieldProps) => (
  <FormField
    label={`${CODE_LENGTH}-digit code`}
    value={value}
    // The field is number-pad, but paste and some keyboards can still deliver
    // spaces or the surrounding text of an autofilled code.
    onChangeText={(next) => onChangeText(next.replace(/\D/g, '').slice(0, CODE_LENGTH))}
    error={error}
    placeholder="123456"
    keyboardType="number-pad"
    // iOS and Android both surface the code from the notification banner
    // with these two, so most people never type it.
    textContentType="oneTimeCode"
    autoComplete="one-time-code"
    maxLength={CODE_LENGTH}
    autoFocus
    style={styles.codeInput}
    // Read digit by digit; "123456" as one number is unusable aloud.
    accessibilityLabel={`Enter the ${CODE_LENGTH} digit code from your email`}
    onSubmitEditing={onSubmitEditing}
    returnKeyType="go"
  />
);

const styles = StyleSheet.create({
  // Wide tracking so six digits read as separable characters rather than a
  // number. Sized well above the 16px floor — this is the one field where a
  // misread digit costs the whole sign-in.
  codeInput: {
    fontFamily: Typography.families.sansMedium,
    fontSize: 28,
    letterSpacing: 8,
    color: Colors.ink,
  },
});
