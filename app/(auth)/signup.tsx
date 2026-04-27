import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth-screen-shell';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Layout } from '@/constants/layout';
import { mapAuthErrorMessage, signUpWithEmail } from '@/lib/auth';

type SignupErrors = {
  email?: string;
  password?: string;
};

const SignupScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    const nextErrors = validateSignupForm(email, password);
    setErrors(nextErrors);
    setFormError('');
    setInfoMessage('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      const authData = await signUpWithEmail({ email, password });

      if (!authData.session) {
        setInfoMessage('We created your account, but your session did not start automatically. Check your email, then sign in.');
        return;
      }

      router.replace('/(auth)/onboarding');
    } catch (error) {
      setFormError(mapAuthErrorMessage(error, 'We could not create your account right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title="Create your account"
      subtitle="Start with your email and password. You can add your name and photo on the next screen."
      footer={
        <>
          <ThemedText variant="caption">Already have an account?</ThemedText>
          <FormButton
            title="Sign in"
            variant="ghost"
            onPress={() => router.push('/(auth)/login')}
          />
        </>
      }
    >
      <View style={styles.form}>
        {formError ? <StatusBanner variant="error" message={formError} /> : null}
        {infoMessage ? <StatusBanner variant="info" message={infoMessage} /> : null}

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
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.password}
          helperText="Use at least 6 characters."
          placeholder="Choose a password"
          secureTextEntry
        />

        <FormButton title="Continue" loading={submitting} onPress={handleSignup} />
      </View>
    </AuthScreenShell>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  form: {
    gap: Layout.padding.md,
  },
});

const validateSignupForm = (email: string, password: string): SignupErrors => {
  const nextErrors: SignupErrors = {};

  const emailError = validateEmail(email);
  if (emailError) {
    nextErrors.email = emailError;
  }

  if (!password.trim()) {
    nextErrors.password = 'Choose a password.';
  } else if (password.trim().length < 6) {
    nextErrors.password = 'Choose a password with at least 6 characters.';
  }

  return nextErrors;
};

const validateEmail = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Enter your email address.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(trimmedValue)) {
    return 'Enter a valid email address.';
  }

  return undefined;
};
