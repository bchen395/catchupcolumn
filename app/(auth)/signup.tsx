import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth-screen-shell';
import { EmailCodeStep } from '@/components/email-code-step';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { PendingInviteBanner } from '@/components/pending-invite-banner';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { useEmailCode } from '@/hooks/use-email-code';
import { usePendingInvite } from '@/hooks/use-pending-invite';

// Signing up is the same two steps as signing in — email, then the code. There
// is no password field: one fewer thing to invent, and nothing to lose later.
// `sendEmailCode` with allowNewUser creates the account, so the code both
// registers and signs in.
const SignupScreen = () => {
  const router = useRouter();
  const { invite } = usePendingInvite();

  // Always onboarding: a brand-new account has no name or photo yet, and an
  // existing account that came through here lands on a form pre-filled from
  // its saved profile, so the extra step is harmless rather than wrong.
  const goToOnboarding = useCallback(() => {
    router.replace('/(auth)/onboarding');
  }, [router]);

  const flow = useEmailCode({ allowNewUser: true, onVerified: goToOnboarding });

  const banner = invite ? (
    <PendingInviteBanner message={Strings.invite.joiningBannerSignup(invite.groupName)} />
  ) : null;

  if (flow.step === 'code') {
    return (
      <AuthScreenShell
        title="Check your email"
        subtitle={`We sent a ${flow.codeLength}-digit code to ${flow.email}. It expires in an hour.`}
        banner={banner}
      >
        <EmailCodeStep flow={flow} submitLabel="Create my account" />
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      title="Create your account"
      subtitle="Just your email — we'll send a code. You can add your name and photo next."
      banner={banner}
      footer={
        <>
          <ThemedText variant="caption">Already have an account?</ThemedText>
          <FormButton title="Sign in" variant="ghost" onPress={() => router.push('/(auth)/login')} />
        </>
      }
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
