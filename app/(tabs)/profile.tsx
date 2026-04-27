import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

import { FormButton } from '@/components/form-button';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { deleteAccount, fetchCurrentUserProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { UserRow } from '@/types';

const ProfileScreen = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [screenError, setScreenError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user) {
        if (isMounted) {
          setLoadingProfile(false);
        }
        return;
      }

      try {
        const currentProfile = await fetchCurrentUserProfile(user.id);

        if (isMounted) {
          setProfile(currentProfile);
        }
      } catch (_error) {
        if (isMounted) {
          setScreenError('We could not load your account details right now.');
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const initials = getInitials(profile?.display_name ?? user?.email ?? 'CU');

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      setScreenError('');

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (_error) {
      setScreenError('We could not sign you out right now. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This will permanently remove your account, posts, and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAccount(true);
              setScreenError('');
              await deleteAccount();
            } catch (_error) {
              setScreenError('We could not delete your account right now. Please try again.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="headline">Your profile</ThemedText>
      <ThemedText variant="body" style={styles.subtitle}>
        Keep track of the account tied to your family Group.
      </ThemedText>

      {screenError ? <StatusBanner variant="error" message={screenError} /> : null}

      <ThemedView variant="card" style={styles.card}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText variant="subheadline" style={styles.initials}>
              {initials}
            </ThemedText>
          </View>
        )}

        <View style={styles.profileText}>
          <ThemedText variant="subheadline">
            {profile?.display_name ?? 'Your Catch Up Column account'}
          </ThemedText>
          <ThemedText variant="body">{user?.email ?? 'No email available'}</ThemedText>
          <ThemedText variant="caption">
            {loadingProfile ? 'Loading your account details...' : 'You can sign out here any time.'}
          </ThemedText>
        </View>
      </ThemedView>

      <FormButton title="Sign out" variant="secondary" loading={signingOut} onPress={handleSignOut} />
      <FormButton
        title="Delete my account"
        variant="destructive"
        loading={deletingAccount}
        onPress={handleDeleteAccount}
      />
    </ThemedView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.padding.lg,
    gap: Layout.padding.md,
  },
  subtitle: {
    color: Colors.textMuted,
  },
  card: {
    padding: Layout.padding.lg,
    gap: Layout.padding.md,
    alignItems: 'center',
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.backgroundWarm,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  initials: {
    color: Colors.accentNavy,
    fontFamily: Typography.families.sansBold,
  },
  profileText: {
    alignItems: 'center',
    gap: Layout.padding.xs,
  },
});

const getInitials = (value: string) => {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};
