import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth-screen-shell';
import { EmailCodeStep } from '@/components/email-code-step';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { PasswordSignIn } from '@/components/password-sign-in';
import { PendingInviteBanner } from '@/components/pending-invite-banner';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { useEmailCode } from '@/hooks/use-email-code';
import { usePendingInvite } from '@/hooks/use-pending-invite';
import { getPendingInvite } from '@/lib/pending-invite';

// A code is the default way in: nothing to remember, and it works for the
// accounts created by hand during Group Zero. The password form is for anyone
// who set one from Profile and prefers it.
type Mode = 'code' | 'password';

const LoginScreen = () => {
  const router = useRouter();
  const { invite } = usePendingInvite();
  const [mode, setMode] = useState<Mode>('code');
  // Set by "Forgot your password?". Recovery is the ordinary code sign-in,
  // then on to choosing a new password instead of home — no reset link, so
  // nothing has to hand a session back to the app through a URL.
  const [recovering, setRecovering] = useState(false);

  // With an invite pending, the root layout's use-auto-join-invite owns
  // navigation (join → welcome); replacing now would race it. That holds while
  // recovering too — they can set a password from Profile afterwards.
  const goAfterSignIn = useCallback(async () => {
    if (!(await getPendingInvite())) {
      router.replace(recovering ? '/(auth)/set-password' : '/(tabs)/home');
    }
  }, [recovering, router]);

  const flow = useEmailCode({ allowNewUser: false, onVerified: goAfterSignIn });

  const codeSent = `We sent a ${flow.codeLength}-digit code to ${flow.email}. It expires in ${flow.codeExpiryMinutes} minutes.`;

  const banner = invite ? (
    <PendingInviteBanner message={Strings.invite.joiningBannerLogin(invite.groupName)} />
  ) : null;

  const footer = (
    <>
      <ThemedText variant="caption">Need an account?</ThemedText>
      <FormButton title="Create one" variant="ghost" onPress={() => router.push('/(auth)/signup')} />
    </>
  );

  if (mode === 'password') {
    return (
      <PasswordSignIn
        banner={banner}
        footer={footer}
        onUseCode={(email) => {
          flow.setEmail(email);
          setRecovering(false);
          setMode('code');
        }}
        onForgotPassword={(email) => {
          setRecovering(true);
          setMode('code');
          void flow.requestCode({ email });
        }}
        onSignedIn={goAfterSignIn}
      />
    );
  }

  if (flow.step === 'code') {
    return (
      <AuthScreenShell
        title="Check your email"
        subtitle={recovering ? `${codeSent} Once you’re in, you can choose a new password.` : codeSent}
        banner={banner}
      >
        <EmailCodeStep flow={flow} submitLabel="Sign in" />
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      title={recovering ? 'Forgot your password?' : 'Welcome back'}
      subtitle={
        recovering
          ? 'We’ll email you a code to sign in. Then you can choose a new password.'
          : 'We’ll email you a code — no password to remember.'
      }
      banner={banner}
      footer={footer}
    >
      <View style={styles.form}>
        {flow.formError ? <StatusBanner variant="error" message={flow.formError} /> : null}

        <FormField
          label="Email address"
          value={flow.email}
          onChangeText={flow.setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          error={flow.fieldError}
          placeholder="you@example.com"
          onSubmitEditing={() => flow.requestCode()}
          returnKeyType="go"
        />

        <FormButton title="Email me a code" loading={flow.sending} onPress={() => flow.requestCode()} />
        <FormButton
          title="Use a password instead"
          variant="ghost"
          onPress={() => {
            setRecovering(false);
            setMode('password');
          }}
        />
      </View>
    </AuthScreenShell>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  form: {
    gap: Layout.padding.md,
  },
});
