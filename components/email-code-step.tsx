import { StyleSheet, View } from 'react-native';

import { CodeField } from '@/components/code-field';
import { FormButton } from '@/components/form-button';
import { StatusBanner } from '@/components/status-banner';
import { Layout } from '@/constants/layout';
import type { useEmailCode } from '@/hooks/use-email-code';

type Props = {
  flow: ReturnType<typeof useEmailCode>;
  submitLabel: string;
};

// The second step of the email → code flow, identical on login and signup.
// Only the button label differs, so the two screens share this.
export const EmailCodeStep = ({ flow, submitLabel }: Props) => {
  const {
    code,
    setCode,
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

      <CodeField value={code} onChangeText={setCode} error={fieldError} onSubmitEditing={submitCode} />

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
});
