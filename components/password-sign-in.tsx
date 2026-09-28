import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth-screen-shell';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { Layout } from '@/constants/layout';
import { validateEmail } from '@/hooks/use-email-code';
import { mapAuthErrorMessage, signInWithEmail } from '@/lib/auth';

type PasswordSignInProps = {
  banner: ReactNode;
  footer: ReactNode;
  // Both hand over whatever email was typed, so the code flow starts with it.
  onUseCode: (email: string) => void;
  // "Forgot your password?" is a code sign-in followed by choosing a new one —
  // the login screen owns both halves.
  onForgotPassword: (email: string) => void;
  onSignedIn: () => Promise<void>;
};

// The password form: the optional second way in, for anyone who set a
// password. Reached from the login screen's "Use a password instead".
export const PasswordSignIn = ({
  banner,
  footer,
  onUseCode,
  onForgotPassword,
  onSignedIn,
}: PasswordSignInProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    const nextErrors: { email?: string; password?: string } = {};
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (!password) nextErrors.password = 'Enter your password.';

    setErrors(nextErrors);
    setFormError('');

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

  const handleForgotPassword = () => {
    const emailError = validateEmail(email);
    setErrors((current) => ({ ...current, email: emailError }));
    setFormError('');

    if (emailError) return;
    onForgotPassword(email);
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
          onSubmitEditing={handleSignIn}
          returnKeyType="go"
        />

        <FormButton title="Forgot your password?" variant="ghost" onPress={handleForgotPassword} />

        <FormButton title="Sign in" loading={submitting} onPress={handleSignIn} />
        <FormButton title="Email me a code instead" variant="ghost" onPress={() => onUseCode(email)} />
      </View>
    </AuthScreenShell>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: Layout.padding.md,
  },
});
