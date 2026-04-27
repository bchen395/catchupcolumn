import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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

import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { createGroup, updateGroupSettings, uploadGroupCover } from '@/lib/groups';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatTime = (hours: number, minutes: number) => {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinute = String(minutes).padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
};

const formatPublishTime = (hours: number, minutes: number) => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
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
  const [showTimePicker, setShowTimePicker] = useState(false);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        created_by: user.id,
      });

      if (coverImage) {
        try {
          const publicUrl = await uploadGroupCover(group.id, coverImage.uri, coverImage.mimeType);
          await updateGroupSettings(group.id, { cover_image_url: publicUrl });
        } catch (_err) {
          // Non-fatal: group already created; skip cover silently
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

          {/* Publish day */}
          <View style={styles.fieldWrapper}>
            <ThemedText variant="label" style={styles.fieldLabel}>
              Publish day
            </ThemedText>
            <View style={styles.dayRow}>
              {DAYS.map((day, index) => (
                <Pressable
                  key={day}
                  onPress={() => setPublishDay(index)}
                  style={[
                    styles.dayButton,
                    publishDay === index ? styles.dayButtonActive : null,
                  ]}
                >
                  <ThemedText
                    variant="caption"
                    style={[
                      styles.dayButtonText,
                      publishDay === index ? styles.dayButtonTextActive : null,
                    ]}
                  >
                    {day}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Publish time */}
          <View style={styles.fieldWrapper}>
            <ThemedText variant="label" style={styles.fieldLabel}>
              Publish time
            </ThemedText>
            <Pressable
              onPress={() => setShowTimePicker(!showTimePicker)}
              style={styles.timeButton}
            >
              <ThemedText variant="body">
                {formatTime(publishHour, publishMinute)}
              </ThemedText>
            </Pressable>

            {showTimePicker ? (
              <View style={styles.timePickerRow}>
                <ScrollView
                  style={styles.timeColumn}
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        setPublishHour(i);
                        setShowTimePicker(false);
                      }}
                      style={[styles.timeItem, publishHour === i ? styles.timeItemActive : null]}
                    >
                      <ThemedText
                        variant="body"
                        style={publishHour === i ? styles.timeItemTextActive : undefined}
                      >
                        {String(i).padStart(2, '0')}:00
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>

          <FormButton
            title="Create Group"
            onPress={handleCreate}
            loading={saving}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateGroupScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Layout.padding.xl,
  },
  banner: {
    margin: Layout.padding.md,
  },
  coverPickerWrapper: {
    height: 180,
    backgroundColor: Colors.backgroundWarm,
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
    borderColor: Colors.border,
  },
  coverPlaceholderText: {
    color: Colors.textMuted,
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: Layout.padding.xs,
    alignItems: 'center',
  },
  coverOverlayText: {
    color: Colors.white,
  },
  form: {
    paddingHorizontal: Layout.padding.lg,
    gap: Layout.padding.lg,
  },
  multilineInput: {
    height: 88,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  fieldWrapper: {
    gap: Layout.padding.sm,
  },
  fieldLabel: {
    color: Colors.accentNavy,
  },
  dayRow: {
    flexDirection: 'row',
    gap: Layout.padding.xs,
  },
  dayButton: {
    flex: 1,
    minHeight: Layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  dayButtonActive: {
    backgroundColor: Colors.accentNavy,
    borderColor: Colors.accentNavy,
  },
  dayButtonText: {
    color: Colors.textMuted,
    fontFamily: Typography.families.sansMedium,
  },
  dayButtonTextActive: {
    color: Colors.white,
  },
  timeButton: {
    minHeight: Layout.touchTargetMin,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  timePickerRow: {
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    maxHeight: 200,
    overflow: 'hidden',
  },
  timeColumn: {
    flex: 1,
  },
  timeItem: {
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.sm,
    minHeight: Layout.touchTargetMin,
    justifyContent: 'center',
  },
  timeItemActive: {
    backgroundColor: Colors.backgroundWarm,
  },
  timeItemTextActive: {
    color: Colors.accentNavy,
    fontFamily: Typography.families.sansSemiBold,
  },
  submitButton: {
    marginTop: Layout.padding.sm,
  },
});
