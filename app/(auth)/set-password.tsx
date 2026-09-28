import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth-screen-shell';
import { CodeField } from '@/components/code-field';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/use-auth';
import { CODE_EXPIRY_MINUTES, CODE_LENGTH } from '@/hooks/use-email-code';
import { useSetPassword } from '@/hooks/use-set-password';
import { hasSetPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth';

// Two ways in, one screen:
//   - from Profile (`from=profile`) — an optional extra way to sign in; back to
//     Profile when done.
//   - from "Forgot your password?" — the person has just signed in with a code,
//     so they are already in; this is the "choose a new one" step, then home.
// A password is never required, so both ways offer "Not now".
//
// It lives in (auth) so the root layout's redirect leaves it alone — right
// after a code sign-in, useAuth hasn't caught up with the new session yet, and
// a screen outside (auth) would be bounced back to login.
const SetPasswordScreen = () => {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromProfile = from === 'profile';
  const { user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const leave = useCallback(() => {
    if (fromProfile && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  }, [fromProfile, router]);

  const flow = useSetPassword({ onSaved: leave });

  // Blank paper for the moment useAuth takes to resolve, rather than a title
  // that flips from "Set" to "Change" as the user arrives.
  if (loading) return null;

  if (!user) {
    return (
      <AuthScreenShell title="Set a password" subtitle="Sign in first, then you can set a password.">
        <FormButton title="Sign in" onPress={() => router.replace('/(auth)/login')} />
      </AuthScreenShell>
    );
  }

  if (flow.step === 'code') {
    return (
      <AuthScreenShell
        title="Check your email"
        subtitle={`To keep your account safe, we sent a ${CODE_LENGTH}-digit code to ${user.email}. It expires in ${CODE_EXPIRY_MINUTES} minutes.`}
      >
        <View style={styles.form}>
          {flow.formError ? <StatusBanner variant="error" message={flow.formError} /> : null}

          <CodeField
            value={flow.code}
            onChangeText={flow.setCode}
            error={flow.fieldError}
            onSubmitEditing={flow.save}
          />

          <FormButton title="Save password" loading={flow.saving} onPress={flow.save} />
          <FormButton
            title={flow.canResend ? 'Send a new code' : `Send a new code in ${flow.secondsUntilResend}s`}
            variant="ghost"
            loading={flow.sending}
            disabled={!flow.canResend}
            onPress={flow.resendCode}
          />
          <FormButton title="Back to your password" variant="ghost" onPress={flow.editPassword} />
        </View>
      </AuthScreenShell>
    );
  }

  const title = hasSetPassword(user)
    ? 'Change your password'
    : fromProfile
      ? 'Set a password'
      : 'Choose a new password';
  const subtitle = fromProfile
    ? 'It’s optional — you can always sign in with an emailed code instead.'
    : 'You’re signed in. Choose a password for next time, or skip it and keep using emailed codes.';

  return (
    <AuthScreenShell title={title} subtitle={subtitle}>
      <View style={styles.form}>
        {flow.formError ? <StatusBanner variant="error" message={flow.formError} /> : null}

        {/* One field and a show toggle, no "confirm password": a typo costs
            nothing here, because an emailed code still gets them in to set
            it again. */}
        <FormField
          label="New password"
          value={flow.password}
          onChangeText={flow.setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          // Lets iOS suggest a strong password that meets the server's rule.
          passwordRules={`minlength: ${PASSWORD_MIN_LENGTH}; maxlength: ${PASSWORD_MAX_LENGTH};`}
          secureTextEntry={!showPassword}
          error={flow.fieldError}
          helperText={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          placeholder="Choose a password"
          onSubmitEditing={flow.save}
          returnKeyType="go"
        />
        <FormButton
          title={showPassword ? 'Hide password' : 'Show password'}
          variant="ghost"
          onPress={() => setShowPassword((current) => !current)}
        />

        <FormButton title="Save password" loading={flow.saving || flow.sending} onPress={flow.save} />
        <FormButton title="Not now" variant="ghost" onPress={leave} />
      </View>
    </AuthScreenShell>
  );
};

export default SetPasswordScreen;

const styles = StyleSheet.create({
  form: {
    gap: Layout.padding.md,
  },
});
