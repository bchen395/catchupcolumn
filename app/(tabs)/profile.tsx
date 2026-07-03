import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppImage } from '@/components/app-image';
import { AvatarPicker } from '@/components/avatar-picker';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { unregisterPushAsync } from '@/lib/notifications';
import {
  deleteAccount,
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  uploadUserAvatar,
} from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { UserRow } from '@/types';

const DISPLAY_NAME_MAX = 60;
const BIO_MAX = 200;

type SelectedAvatar = {
  uri: string;
  mimeType?: string | null;
};

type EditErrors = {
  displayName?: string;
  bio?: string;
  avatar?: string;
};

const ProfileScreen = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [screenError, setScreenError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Inline edit mode (mirrors the group settings edit-in-place pattern rather
  // than pushing a separate screen or modal).
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<SelectedAvatar | null>(null);
  const [editErrors, setEditErrors] = useState<EditErrors>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

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
  const memberSince = formatMemberSince(profile?.created_at);

  const handleStartEdit = () => {
    setEditName(profile?.display_name ?? '');
    setEditBio(profile?.bio ?? '');
    setAvatarPreviewUrl(profile?.avatar_url ?? null);
    setSelectedAvatar(null);
    setEditErrors({});
    setScreenError('');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditErrors({});
  };

  const handlePickImage = async () => {
    setEditErrors((current) => ({ ...current, avatar: undefined }));
    setScreenError('');

    try {
      setPickingImage(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setEditErrors((current) => ({
          ...current,
          avatar: 'Please allow photo access, or keep your current picture.',
        }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setSelectedAvatar({ uri: asset.uri, mimeType: asset.mimeType });
      setAvatarPreviewUrl(asset.uri);
    } catch (_error) {
      setEditErrors((current) => ({
        ...current,
        avatar: 'We could not open your photo library right now. Try again in a moment.',
      }));
    } finally {
      setPickingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedBio = editBio.trim();
    const nextErrors: EditErrors = {};

    if (!trimmedName) {
      nextErrors.displayName = 'Enter the name you want your family to see.';
    } else if (trimmedName.length > DISPLAY_NAME_MAX) {
      nextErrors.displayName = `Keep your name under ${DISPLAY_NAME_MAX} characters.`;
    }

    if (trimmedBio.length > BIO_MAX) {
      nextErrors.bio = `Keep your bio under ${BIO_MAX} characters.`;
    }

    setEditErrors(nextErrors);
    setScreenError('');

    if (!user || Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSavingProfile(true);

      // selectedAvatar = a freshly picked local image to upload. Otherwise
      // avatarPreviewUrl holds either the existing remote URL (keep) or null
      // (the photo was removed).
      let nextAvatarUrl = avatarPreviewUrl;

      if (selectedAvatar) {
        try {
          const uploadResult = await uploadUserAvatar({
            userId: user.id,
            imageUri: selectedAvatar.uri,
            mimeType: selectedAvatar.mimeType,
          });
          nextAvatarUrl = uploadResult.publicUrl;
        } catch (_error) {
          setEditErrors((current) => ({
            ...current,
            avatar: 'We could not upload that photo. Try a different one, or save without changing it.',
          }));
          return;
        }
      }

      const updated = await updateCurrentUserProfile(user.id, {
        display_name: trimmedName,
        bio: trimmedBio || null,
        avatar_url: nextAvatarUrl,
      });

      setProfile(updated);
      setSelectedAvatar(null);
      setEditing(false);
    } catch (_error) {
      setScreenError(Strings.error.profileSave);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      setScreenError('');

      // Drop this device's push token first so the signed-out account stops
      // receiving pushes. Best-effort — never block sign-out on it.
      if (user) {
        await unregisterPushAsync(user.id);
      }

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
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {editing ? (
        <View style={styles.editBlock}>
          <ThemedText style={styles.editHeading}>Edit your profile</ThemedText>

          <AvatarPicker
            label="Photo"
            imageUrl={avatarPreviewUrl}
            displayName={editName}
            onPickImage={handlePickImage}
            onClearImage={() => {
              setSelectedAvatar(null);
              setAvatarPreviewUrl(null);
              setEditErrors((current) => ({ ...current, avatar: undefined }));
            }}
            loading={pickingImage}
            helperText="Optional"
            error={editErrors.avatar}
          />

          <FormField
            label="Display name"
            value={editName}
            onChangeText={setEditName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={DISPLAY_NAME_MAX}
            error={editErrors.displayName}
            placeholder="Your name"
          />

          <FormField
            label="Bio"
            value={editBio}
            onChangeText={setEditBio}
            multiline
            numberOfLines={3}
            maxLength={BIO_MAX}
            helperText={`Optional — up to ${BIO_MAX} characters.`}
            error={editErrors.bio}
            placeholder="A sentence or two about you (optional)"
            style={styles.bioInput}
          />

          {screenError ? <StatusBanner variant="error" message={screenError} /> : null}

          <View style={styles.editButtons}>
            <FormButton
              title="Save"
              loading={savingProfile}
              onPress={handleSaveProfile}
              style={styles.editButtonHalf}
            />
            <FormButton
              title="Cancel"
              variant="secondary"
              disabled={savingProfile}
              onPress={handleCancelEdit}
              style={styles.editButtonHalf}
            />
          </View>
        </View>
      ) : (
        <>
          {/* Byline hero: a contributor's masthead. The kicker + serif name echo
              the newspaper voice used on Home, and the avatar carries a camera
              badge so it reads as editable. */}
          <View style={styles.heroBlock}>
            <Pressable
              onPress={handleStartEdit}
              accessibilityRole="button"
              accessibilityLabel="Change your profile photo"
              style={({ pressed }) => [styles.avatarWrap, pressed && styles.avatarWrapPressed]}
            >
              {profile?.avatar_url ? (
                <AppImage source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <ThemedText style={styles.initials}>{initials}</ThemedText>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <MaterialCommunityIcons name="camera-outline" size={18} color={Colors.paper} />
              </View>
            </Pressable>

            <ThemedText style={styles.kicker}>FROM THE DESK OF</ThemedText>
            <ThemedText style={styles.displayName} numberOfLines={2}>
              {profile?.display_name ?? 'Your account'}
            </ThemedText>
            {memberSince ? (
              <ThemedText style={styles.memberSince}>Writing since {memberSince}</ThemedText>
            ) : null}
            <ThemedText style={styles.email} numberOfLines={1}>
              {user?.email ?? 'No email available'}
            </ThemedText>
            {profile?.bio ? <ThemedText style={styles.bio}>{profile.bio}</ThemedText> : null}
            {loadingProfile ? (
              <ThemedText variant="caption" style={styles.loadingHint}>
                Loading your account details…
              </ThemedText>
            ) : null}
          </View>

          {screenError ? <StatusBanner variant="error" message={screenError} /> : null}

          <FormButton
            title="Edit profile"
            variant="secondary"
            onPress={handleStartEdit}
            accessory={
              <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.orange} />
            }
          />

          <View style={styles.accountActions}>
            <FormButton
              title="Sign out"
              variant="secondary"
              loading={signingOut}
              onPress={handleSignOut}
            />
          </View>

          <View style={styles.dangerZone}>
            <Pressable
              onPress={handleDeleteAccount}
              accessibilityRole="button"
              accessibilityLabel="Delete my account"
              disabled={deletingAccount}
              style={styles.deleteLink}
            >
              <ThemedText style={styles.deleteLinkText}>
                {deletingAccount ? 'Deleting…' : 'Delete my account'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.legalRow}>
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(Strings.legal.privacyUrl)}
              accessibilityRole="link"
              accessibilityLabel="Read the privacy policy"
              hitSlop={8}
            >
              <ThemedText style={styles.legalLink}>Privacy Policy</ThemedText>
            </Pressable>
            <ThemedText style={styles.legalDot}>·</ThemedText>
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(Strings.legal.termsUrl)}
              accessibilityRole="link"
              accessibilityLabel="Read the terms of service"
              hitSlop={8}
            >
              <ThemedText style={styles.legalLink}>Terms of Service</ThemedText>
            </Pressable>
          </View>
        </>
      )}
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
  // Hero sits directly on the paper — no card chrome. Large avatar, byline
  // kicker, display name in newspaper serif, then the warm "writing since"
  // line, email, and bio.
  heroBlock: {
    alignItems: 'center',
    gap: 4,
  },
  avatarWrap: {
    marginBottom: Layout.padding.sm,
  },
  avatarWrapPressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.peach,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  // Small orange disc pinned to the avatar's lower-right so the photo clearly
  // reads as tap-to-change. Paper ring separates it from the avatar edge.
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.paperWarm,
  },
  initials: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xxl,
    lineHeight: Typography.sizes.xxl,
    color: Colors.orange,
  },
  kicker: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    color: Colors.orange,
    marginTop: Layout.padding.xs,
  },
  displayName: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xxl,
    lineHeight: 34,
    color: Colors.ink,
    textAlign: 'center',
  },
  memberSince: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.body,
    fontStyle: 'italic',
    color: Colors.inkSoft,
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
  // Edit mode reuses the onboarding building blocks (AvatarPicker + FormField)
  // so the editing flow matches what people saw during setup.
  editBlock: {
    gap: Layout.padding.md,
  },
  editHeading: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xl,
    lineHeight: 30,
    color: Colors.ink,
    marginBottom: Layout.padding.xs,
  },
  bioInput: {
    minHeight: Layout.input.multilineMinHeight,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: Layout.padding.sm,
    marginTop: Layout.padding.xs,
  },
  editButtonHalf: {
    flex: 1,
  },
  accountActions: {
    gap: Layout.padding.sm,
    marginTop: Layout.padding.lg,
  },
  // Account deletion is destructive and rare: keep it a quiet, separated text
  // link rather than a button sitting at the same weight as "Sign out". The
  // 48px min-height preserves the tap target even though the text is small.
  dangerZone: {
    marginTop: Layout.padding.xl,
    alignItems: 'center',
  },
  deleteLink: {
    minHeight: Layout.touchTargetMin,
    justifyContent: 'center',
    paddingHorizontal: Layout.padding.md,
  },
  deleteLinkText: {
    fontFamily: Typography.families.sansMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    textDecorationLine: 'underline',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.padding.sm,
    marginTop: Layout.padding.md,
  },
  legalLink: {
    fontFamily: Typography.families.sansMedium,
    fontSize: Typography.sizes.body,
    color: Colors.inkSoft,
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontFamily: Typography.families.sansMedium,
    fontSize: Typography.sizes.body,
    color: Colors.inkSoft,
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

const formatMemberSince = (createdAt?: string | null) => {
  if (!createdAt) {
    return '';
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
