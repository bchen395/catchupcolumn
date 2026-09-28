import type { User } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FormButton } from '@/components/form-button';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { hasSetPassword } from '@/lib/auth';

// Profile's one sign-in setting. A password is an optional second way in —
// it's the only one that works when an email doesn't arrive — so it lives
// here and nowhere else: never in onboarding, never prompted. The note under
// the button says so, so "Set a password" doesn't read as a to-do.
export const PasswordSetting = ({ user }: { user: User | null }) => {
  const router = useRouter();
  const hasPassword = hasSetPassword(user);

  return (
    <View style={styles.block}>
      <FormButton
        title={hasPassword ? 'Change your password' : 'Set a password'}
        variant="secondary"
        onPress={() => router.push({ pathname: '/(auth)/set-password', params: { from: 'profile' } })}
      />
      <ThemedText variant="ui" style={styles.note}>
        {hasPassword
          ? 'You can sign in with your password or an emailed code.'
          : 'Optional — you can always sign in with an emailed code.'}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    gap: Layout.padding.sm,
  },
  note: {
    color: Colors.inkSoft,
    textAlign: 'center',
  },
});
