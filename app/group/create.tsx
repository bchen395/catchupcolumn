import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
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
import {
  AMPM_ITEMS,
  from12hTo24,
  HOURS_12,
  MINUTE_ITEMS,
  SnapColumn,
  to12hIndices,
} from '@/components/snap-column';

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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHourIndex, setTempHourIndex] = useState(9);
  const [tempMinuteIndex, setTempMinuteIndex] = useState(0);
  const [tempAmpmIndex, setTempAmpmIndex] = useState(0);

  const openTimePicker = () => {
    const { hourIndex, ampmIndex, minuteIndex } = to12hIndices(publishHour, publishMinute);
    setTempHourIndex(hourIndex);
    setTempMinuteIndex(minuteIndex);
    setTempAmpmIndex(ampmIndex);
    setShowTimePicker(true);
  };

  const confirmTime = () => {
    setPublishHour(from12hTo24(tempHourIndex, tempAmpmIndex));
    setPublishMinute([0, 15, 30, 45][tempMinuteIndex]);
    setShowTimePicker(false);
  };

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
        timezone: getDeviceTimezone(),
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
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={28} color={Colors.accentNavy} />
            </Pressable>
          ),
        }}
      />
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowTimePicker(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ThemedText variant="label" style={styles.modalTitle}>
              Publish time
            </ThemedText>
            <View style={styles.modalColumns}>
              <SnapColumn
                data={HOURS_12}
                selectedIndex={tempHourIndex}
                onSelect={setTempHourIndex}
                visible={showTimePicker}
              />
              <ThemedText variant="body" style={styles.colonSeparator}>:</ThemedText>
              <SnapColumn
                data={MINUTE_ITEMS}
                selectedIndex={tempMinuteIndex}
                onSelect={setTempMinuteIndex}
                visible={showTimePicker}
                width={64}
              />
              <SnapColumn
                data={AMPM_ITEMS}
                selectedIndex={tempAmpmIndex}
                onSelect={setTempAmpmIndex}
                visible={showTimePicker}
                width={64}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowTimePicker(false)} style={styles.modalActionButton}>
                <ThemedText variant="body" style={styles.cancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={confirmTime} style={[styles.modalActionButton, styles.doneButton]}>
                <ThemedText variant="body" style={styles.doneText}>Done</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
              onPress={openTimePicker}
              style={styles.timeButton}
            >
              <ThemedText variant="body">
                {formatTime(publishHour, publishMinute)}
              </ThemedText>
            </Pressable>
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
    </>
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
  backButton: {
    paddingHorizontal: Layout.padding.sm,
    minWidth: 48,
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    width: 320,
    padding: Layout.padding.lg,
    gap: Layout.padding.md,
  },
  modalTitle: {
    color: Colors.accentNavy,
    textAlign: 'center',
  },
  modalColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.padding.xs,
  },
  colonSeparator: {
    fontFamily: Typography.families.sansSemiBold,
    color: Colors.textMuted,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.padding.md,
    marginTop: Layout.padding.xs,
  },
  modalActionButton: {
    minHeight: Layout.touchTargetMin,
    paddingHorizontal: Layout.padding.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.borderRadius.md,
  },
  doneButton: {
    backgroundColor: Colors.accentNavy,
    paddingHorizontal: Layout.padding.lg,
  },
  cancelText: {
    color: Colors.textMuted,
  },
  doneText: {
    color: Colors.white,
    fontFamily: Typography.families.sansSemiBold,
  },
  submitButton: {
    marginTop: Layout.padding.sm,
  },
});
