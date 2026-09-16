import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth-screen-shell';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { Layout } from '@/constants/layout';
import { validateEmail } from '@/hooks/use-email-code';
import { mapAuthErrorMessage, sendPasswordResetEmail, signInWithEmail } from '@/lib/auth';

type PasswordSignInProps = {
  banner: ReactNode;
  footer: ReactNode;
  onUseCode: () => void;
  onSignedIn: () => Promise<void>;
};

// The password form, kept for accounts created before the code flow existed.
// Reached from the login screen's "Use a password instead".
export const PasswordSignIn = ({ banner, footer, onUseCode, onSignedIn }: PasswordSignInProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [resetNotice, setResetNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleSignIn = async () => {
    const nextErrors: { email?: string; password?: string } = {};
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (!password.trim()) nextErrors.password = 'Enter your password.';

    setErrors(nextErrors);
    setFormError('');
    setResetNotice('');

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSubmitting(true);
      await signInWithEmail({ email, password });
      await onSignedIn();
    } catch (error) {
      setFormError(mapAuthErrorMessage(error, 'We could not sign you in right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailError = validateEmail(email);
    setErrors((current) => ({ ...current, email: emailError }));
    setFormError('');
    setResetNotice('');

    if (emailError) return;

    try {
      setSendingReset(true);
      await sendPasswordResetEmail(email);
      setResetNotice('If that email belongs to a Catch Up Column account, we sent a reset link.');
    } catch (error) {
      setFormError(mapAuthErrorMessage(error, 'We could not send a reset email right now.'));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <AuthScreenShell
      title="Welcome back"
      subtitle="Sign in to read the latest edition and write something for this week."
      banner={banner}
      footer={footer}
    >
      <View style={styles.form}>
        {formError ? <StatusBanner variant="error" message={formError} /> : null}
        {resetNotice ? <StatusBanner variant="success" message={resetNotice} /> : null}

        <FormField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          error={errors.email}
          placeholder="you@example.com"
        />

        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          error={errors.password}
          placeholder="Enter your password"
          secureTextEntry
        />

        <FormButton
          title="Forgot your password?"
          variant="ghost"
          loading={sendingReset}
          onPress={handleForgotPassword}
        />

        <FormButton title="Sign in" loading={submitting} onPress={handleSignIn} />
        <FormButton title="Email me a code instead" variant="ghost" onPress={onUseCode} />
      </View>
    </AuthScreenShell>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: Layout.padding.md,
  },
});
