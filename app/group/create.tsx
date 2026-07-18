import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { DaySelector } from '@/components/day-selector';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { TimeField } from '@/components/time-picker-modal';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/use-auth';
import { createGroup, removeGroupCover, updateGroupSettings, uploadGroupCover } from '@/lib/groups';

const formatPublishTime = (hours: number, minutes: number) => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

const getDeviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

type SelectedImage = {
  uri: string;
  mimeType?: string | null;
};

const CreateGroupScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [publishDay, setPublishDay] = useState(0);
  const [publishHour, setPublishHour] = useState(9);
  const [publishMinute, setPublishMinute] = useState(0);
  const [coverImage, setCoverImage] = useState<SelectedImage | null>(null);

  const [nameError, setNameError] = useState('');
  const [screenError, setScreenError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  const descriptionRef = useRef(null);

  const handlePickCoverImage = async () => {
    setScreenError('');
    try {
      setPickingImage(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCoverImage({ uri: asset.uri, mimeType: asset.mimeType });
      }
    } catch (_err) {
      setScreenError('Could not open your photo library right now. Try again in a moment.');
    } finally {
      setPickingImage(false);
    }
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Give your Group a name so your family can find it.');
      return;
    }
    setNameError('');
    setScreenError('');

    if (!user) return;

    try {
      setSaving(true);

      const group = await createGroup({
        name: trimmedName,
        description: description.trim() || null,
        publish_day: publishDay,
        publish_time: formatPublishTime(publishHour, publishMinute),
        timezone: getDeviceTimezone(),
        created_by: user.id,
      });

      if (coverImage) {
        let upload: Awaited<ReturnType<typeof uploadGroupCover>> | null = null;
        try {
          upload = await uploadGroupCover(group.id, coverImage.uri);
          await updateGroupSettings(group.id, { cover_image_url: upload.publicUrl });
        } catch (_err) {
          // Non-fatal: the group already exists; remove the orphan storage
          // object (if upload had succeeded) so we don't leak it.
          if (upload) {
            await removeGroupCover(upload.storagePath).catch(() => undefined);
          }
        }
      }

      router.replace(`/group/${group.id}`);
    } catch (err) {
      console.error('createGroup error:', err);
      setScreenError('Something went wrong creating your Group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={28} color={Colors.ink} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {screenError ? (
            <StatusBanner variant="error" message={screenError} />
          ) : null}

          {/* Cover image */}
          <Pressable onPress={handlePickCoverImage} style={styles.coverPickerWrapper}>
            {coverImage ? (
              <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} resizeMode="cover" />
            ) : (
              <View style={styles.coverPlaceholder}>
                <ThemedText variant="caption" style={styles.coverPlaceholderText}>
                  {pickingImage ? 'Opening…' : 'Add a cover photo (optional)'}
                </ThemedText>
              </View>
            )}
            {coverImage ? (
              <View style={styles.coverOverlay}>
                <ThemedText variant="caption" style={styles.coverOverlayText}>
                  Tap to change
                </ThemedText>
              </View>
            ) : null}
          </Pressable>

          <View style={styles.form}>
            <FormField
              label="Group name *"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (nameError) setNameError('');
              }}
              placeholder="e.g. The Williams Family Weekly"
              returnKeyType="next"
              onSubmitEditing={() => {
                if (descriptionRef.current) {
                  (descriptionRef.current as any).focus();
                }
              }}
              error={nameError || null}
            />

            <FormField
              ref={descriptionRef}
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="What's this Group about?"
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />

            <DaySelector value={publishDay} onChange={setPublishDay} />

            <TimeField
              hour24={publishHour}
              minute={publishMinute}
              onChange={(h, m) => {
                setPublishHour(h);
                setPublishMinute(m);
              }}
            />

            <FormButton
              title="Create Group"
              onPress={handleCreate}
              loading={saving}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default CreateGroupScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.paperWarm,
  },
  scroll: {
    paddingBottom: Layout.padding.xl,
  },
  banner: {
    margin: Layout.padding.md,
  },
  // A quiet ink-wash well with a hairline edge — reads as the empty plate
  // where the cover photo will print.
  coverPickerWrapper: {
    height: 180,
    backgroundColor: Colors.hairline,
    marginBottom: Layout.padding.md,
    overflow: 'hidden',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: Colors.hairline,
  },
  coverPlaceholderText: {
    color: Colors.inkSoft,
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.coverOverlay,
    paddingVertical: Layout.padding.xs,
    alignItems: 'center',
  },
  coverOverlayText: {
    color: Colors.paper,
  },
  form: {
    paddingHorizontal: Layout.padding.lg,
    gap: Layout.padding.lg,
  },
  multilineInput: {
    minHeight: Layout.input.multilineMinHeight,
    paddingTop: Layout.input.paddingV,
    textAlignVertical: 'top',
  },
  backButton: {
    paddingHorizontal: Layout.padding.sm,
    minWidth: 48,
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: Layout.padding.sm,
  },
});
