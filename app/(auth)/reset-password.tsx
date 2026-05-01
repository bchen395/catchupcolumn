import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth-screen-shell';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { Layout } from '@/constants/layout';
import { mapAuthErrorMessage, updatePassword } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type ResetErrors = {
  password?: string;
  confirm?: string;
};

const ResetPasswordScreen = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<ResetErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [linkReady, setLinkReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const consumeUrl = async (url: string | null) => {
      if (!url) {
        if (!cancelled) setLinkReady(true);
        return;
      }

      try {
        const parsed = Linking.parse(url);
        const code = parsed.queryParams?.code;

        if (typeof code === 'string') {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Implicit flow: tokens in URL fragment after the redirect path.
          const hashIndex = url.indexOf('#');
          if (hashIndex >= 0) {
            const hash = url.slice(hashIndex + 1);
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            const type = params.get('type');
            if (type === 'recovery' && access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({ access_token, refresh_token });
              if (error) throw error;
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setFormError(mapAuthErrorMessage(error, 'This reset link is no longer valid. Request a new one.'));
        }
      } finally {
        if (!cancelled) setLinkReady(true);
      }
    };

    Linking.getInitialURL().then(consumeUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => consumeUrl(url));

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const handleSubmit = async () => {
    const nextErrors: ResetErrors = {};

    if (!password.trim()) {
      nextErrors.password = 'Choose a new password.';
    } else if (password.trim().length < 6) {
      nextErrors.password = 'Choose a password with at least 6 characters.';
    }

    if (confirm !== password) {
      nextErrors.confirm = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      await updatePassword(password);
      router.replace('/(tabs)/inbox');
    } catch (error) {
      setFormError(mapAuthErrorMessage(error, 'We could not update your password right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title="Set a new password"
      subtitle="Choose a new password for your account. You will be signed in once it is saved."
    >
      <View style={styles.form}>
        {!linkReady ? (
          <StatusBanner variant="info" message="Verifying your reset link…" />
        ) : null}
        {formError ? <StatusBanner variant="error" message={formError} /> : null}

        <FormField
          label="New password"
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

        <FormField
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.confirm}
          placeholder="Re-enter your new password"
          secureTextEntry
        />

        <FormButton title="Save new password" loading={submitting} onPress={handleSubmit} />
      </View>
    </AuthScreenShell>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  form: {
    gap: Layout.padding.md,
  },
});
