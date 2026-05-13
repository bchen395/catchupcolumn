import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppImage } from '@/components/app-image';
import { FormButton } from '@/components/form-button';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { deleteAccount, fetchCurrentUserProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { UserRow } from '@/types';

const ProfileScreen = () => {
  const router = useRouter();
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
          setScreenError(Strings.error.profileLoad);
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
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <View style={styles.heroBlock}>
        {profile?.avatar_url ? (
          <AppImage source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText style={styles.initials}>{initials}</ThemedText>
          </View>
        )}
        <ThemedText style={styles.displayName} numberOfLines={1}>
          {profile?.display_name ?? 'Your account'}
        </ThemedText>
        <ThemedText style={styles.email} numberOfLines={1}>
          {user?.email ?? 'No email available'}
        </ThemedText>
        {profile?.bio ? (
          <ThemedText style={styles.bio}>{profile.bio}</ThemedText>
        ) : null}
        {loadingProfile ? (
          <ThemedText variant="caption" style={styles.loadingHint}>
            Loading your account details…
          </ThemedText>
        ) : null}
      </View>

      {screenError ? <StatusBanner variant="error" message={screenError} /> : null}

      <View style={styles.linkSection}>
        <Pressable
          onPress={() => router.push('/groups')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
        >
          <MaterialCommunityIcons
            name="account-group-outline"
            size={22}
            color={Colors.orange}
          />
          <ThemedText style={styles.linkLabel}>My Groups</ThemedText>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={Colors.orange + 'CC'}
          />
        </Pressable>

      </View>

      <View style={styles.accountActions}>
        <FormButton
          title="Sign out"
          variant="secondary"
          loading={signingOut}
          onPress={handleSignOut}
        />
        <FormButton
          title="Delete my account"
          variant="destructive"
          loading={deletingAccount}
          onPress={handleDeleteAccount}
        />
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.paperWarm,
  },
  scroll: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.xl,
    paddingBottom: Layout.padding.xl,
    gap: Layout.padding.lg,
  },
  // Hero matches the Figma profile screen: large avatar, display name in
  // newspaper serif, email and bio underneath. No card chrome — sits directly
  // on the paper.
  heroBlock: {
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.peach,
    marginBottom: Layout.padding.sm,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  initials: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xxl,
    lineHeight: Typography.sizes.xxl,
    color: Colors.orange,
  },
  displayName: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xxl,
    lineHeight: 32,
    color: Colors.ink,
    textAlign: 'center',
  },
  email: {
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.body,
    color: Colors.inkSoft,
  },
  bio: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.body,
    fontStyle: 'italic',
    color: Colors.ink,
    textAlign: 'center',
    marginTop: Layout.padding.sm,
    paddingHorizontal: Layout.padding.lg,
  },
  loadingHint: {
    marginTop: Layout.padding.sm,
  },
  linkSection: {
    gap: Layout.padding.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    minHeight: Layout.touchTargetMin + 4,
    borderRadius: 999,
    backgroundColor: Colors.peach + '66',
  },
  linkRowPressed: {
    backgroundColor: Colors.peach,
  },
  linkLabel: {
    flex: 1,
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.body,
    color: Colors.orange,
  },
  accountActions: {
    gap: Layout.padding.sm,
    marginTop: Layout.padding.lg,
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
