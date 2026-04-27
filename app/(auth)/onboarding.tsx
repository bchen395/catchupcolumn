import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth-screen-shell';
import { AvatarPicker } from '@/components/avatar-picker';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/use-auth';
import {
    clearNeedsOnboardingFlag,
    fetchCurrentUserProfile,
    updateCurrentUserProfile,
    uploadUserAvatar,
} from '@/lib/auth';

type OnboardingErrors = {
  displayName?: string;
  avatar?: string;
};

type SelectedAvatar = {
  uri: string;
  mimeType?: string | null;
};

const OnboardingScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<SelectedAvatar | null>(null);
  const [errors, setErrors] = useState<OnboardingErrors>({});
  const [screenError, setScreenError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const profile = await fetchCurrentUserProfile(user.id);

        if (!isMounted || !profile) {
          return;
        }

        const fallbackName = getFallbackDisplayName(user.email);

        if (profile.display_name && profile.display_name.toLowerCase() !== fallbackName.toLowerCase()) {
          setDisplayName(profile.display_name);
        }

        setAvatarPreviewUrl(profile.avatar_url);
      } catch (_error) {
        if (isMounted) {
          setScreenError('We could not load your profile just yet. You can still finish setup below.');
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

  const handlePickImage = async () => {
    setErrors((currentErrors) => ({
      ...currentErrors,
      avatar: undefined,
    }));
    setScreenError('');

    try {
      setPickingImage(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          avatar: 'Please allow photo access, or keep going without a picture.',
        }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setSelectedAvatar({ uri: asset.uri, mimeType: asset.mimeType });
      setAvatarPreviewUrl(asset.uri);
    } catch (_error) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        avatar: 'We could not open your photo library right now. Try again in a moment.',
      }));
    } finally {
      setPickingImage(false);
    }
  };

  const handleComplete = async () => {
    const trimmedDisplayName = displayName.trim();
    const nextErrors: OnboardingErrors = {};

    if (!trimmedDisplayName) {
      nextErrors.displayName = 'Enter the name you want your family to see.';
    }

    setErrors(nextErrors);
    setScreenError('');

    if (!user || Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);

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
          setErrors((currentErrors) => ({
            ...currentErrors,
            avatar: 'We could not upload that photo. Try a different one, or keep going without it.',
          }));
          return;
        }
      }

      await updateCurrentUserProfile(user.id, {
        avatar_url: nextAvatarUrl,
        display_name: trimmedDisplayName,
      });
      await clearNeedsOnboardingFlag();
      router.replace('/(tabs)/inbox');
    } catch (_error) {
      setScreenError('We could not save your profile yet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthScreenShell
      title="Set up your profile"
      subtitle="Add the name your family will see. A photo is optional and you can always add one later."
    >
      <View style={styles.form}>
        {screenError ? <StatusBanner variant="error" message={screenError} /> : null}
        {loadingProfile ? <StatusBanner variant="info" message="Getting your profile ready..." /> : null}

        <ThemedText variant="caption">
          Signed in as {user?.email ?? 'your account'}
        </ThemedText>

        <AvatarPicker
          label="Photo"
          imageUrl={avatarPreviewUrl}
          displayName={displayName}
          onPickImage={handlePickImage}
          onClearImage={() => {
            setSelectedAvatar(null);
            setAvatarPreviewUrl(null);
            setErrors((currentErrors) => ({
              ...currentErrors,
              avatar: undefined,
            }));
          }}
          loading={pickingImage}
          helperText="Optional"
          error={errors.avatar}
        />

        <FormField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          error={errors.displayName}
          placeholder="Your name"
        />

        <FormButton title="Finish setup" loading={saving} onPress={handleComplete} />
      </View>
    </AuthScreenShell>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  form: {
    gap: Layout.padding.md,
  },
});

const getFallbackDisplayName = (email?: string | null) => {
  if (!email) {
    return '';
  }

  return email.split('@')[0] ?? '';
};
