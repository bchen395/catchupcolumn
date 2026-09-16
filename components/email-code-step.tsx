import { StyleSheet, View } from 'react-native';

import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import type { useEmailCode } from '@/hooks/use-email-code';

type Props = {
  flow: ReturnType<typeof useEmailCode>;
  submitLabel: string;
};

// The second step of the email → code flow, identical on login and signup.
// Only the button label differs, so the two screens share this rather than
// keeping two copies of a field that has to stay exactly this forgiving.
export const EmailCodeStep = ({ flow, submitLabel }: Props) => {
  const {
    code,
    setCode,
    codeLength,
    fieldError,
    formError,
    verifying,
    sending,
    canResend,
    secondsUntilResend,
    requestCode,
    submitCode,
    editEmail,
  } = flow;

  return (
    <View style={styles.form}>
      {formError ? <StatusBanner variant="error" message={formError} /> : null}

      <FormField
        label={`${codeLength}-digit code`}
        value={code}
        onChangeText={setCode}
        error={fieldError}
        placeholder="123456"
        keyboardType="number-pad"
        // iOS and Android both surface the code from the notification banner
        // with these two, so most people never type it.
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={codeLength}
        autoFocus
        style={styles.codeInput}
        // Read digit by digit; "123456" as one number is unusable aloud.
        accessibilityLabel={`Enter the ${codeLength} digit code from your email`}
        onSubmitEditing={submitCode}
        returnKeyType="go"
      />

      <FormButton title={submitLabel} loading={verifying} onPress={submitCode} />

      <FormButton
        title={
          canResend
            ? 'Send a new code'
            : `Send a new code in ${secondsUntilResend}s`
        }
        variant="ghost"
        loading={sending}
        disabled={!canResend}
        onPress={() => requestCode({ isResend: true })}
      />

      <FormButton title="Use a different email" variant="ghost" onPress={editEmail} />
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: Layout.padding.md,
  },
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
