import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    View
} from 'react-native';

import { AppImage } from '@/components/app-image';
import { ErrorState } from '@/components/error-state';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import {
    deleteGroup,
    fetchGroupDetails,
    leaveGroup,
    updateGroupSettings,
    removeGroupCover,
    uploadGroupCover,
} from '@/lib/groups';
import {
    AMPM_ITEMS,
    from12hTo24,
    HOURS_12,
    MINUTE_ITEMS,
    SnapColumn,
    to12hIndices,
} from '@/components/snap-column';
import type { GroupWithMembers } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatPublishSchedule = (publishDay: number, publishTime: string) => {
  const day = DAYS[publishDay] ?? 'Sunday';
  const [hourStr, minuteStr] = publishTime.split(':');
  const hours = parseInt(hourStr ?? '9', 10);
  const minutes = parseInt(minuteStr ?? '0', 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `Every ${day} at ${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
};

// ---------------------------------------------------------------------------
// Member row sub-component
// ---------------------------------------------------------------------------

type MemberRowProps = {
  displayName: string;
  avatarUrl: string | null;
  role: 'moderator' | 'contributor';
  isCurrentUser: boolean;
};

const MemberRow = ({ displayName, avatarUrl, role, isCurrentUser }: MemberRowProps) => {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={memberStyles.row}>
      {avatarUrl ? (
        <AppImage source={{ uri: avatarUrl }} style={memberStyles.avatar} />
      ) : (
        <View style={[memberStyles.avatar, memberStyles.fallback]}>
          <ThemedText variant="caption" style={memberStyles.initials}>
            {initials}
          </ThemedText>
        </View>
      )}
      <View style={memberStyles.info}>
        <ThemedText variant="body" style={memberStyles.name}>
          {displayName}
          {isCurrentUser ? ' (you)' : ''}
        </ThemedText>
        <View style={[memberStyles.badge, role === 'moderator' ? memberStyles.badgeMod : null]}>
          <ThemedText variant="caption" style={role === 'moderator' ? memberStyles.badgeModText : memberStyles.badgeContribText}>
            {role === 'moderator' ? 'Moderator' : 'Contributor'}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const memberStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingVertical: Layout.padding.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fallback: {
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.accentNavy,
    fontFamily: Typography.families.sansBold,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: Typography.families.sansMedium,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.padding.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeMod: {
    backgroundColor: '#EEF2F5',
    borderColor: Colors.accentNavy,
  },
  badgeModText: {
    color: Colors.accentNavy,
    fontFamily: Typography.families.sansSemiBold,
  },
  badgeContribText: {
    color: Colors.textMuted,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

const GroupDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState('');

  // Editing state (moderator only)
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublishDay, setEditPublishDay] = useState(0);
  const [editPublishHour, setEditPublishHour] = useState(9);
  const [editPublishMinute, setEditPublishMinute] = useState(0);
  const [editNameError, setEditNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickingCover, setPickingCover] = useState(false);

  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [tempHourIndex, setTempHourIndex] = useState(0);
  const [tempMinuteIndex, setTempMinuteIndex] = useState(0);
  const [tempAmpmIndex, setTempAmpmIndex] = useState(0);

  const openSchedulePicker = () => {
    const { hourIndex, ampmIndex, minuteIndex } = to12hIndices(editPublishHour, editPublishMinute);
    setTempHourIndex(hourIndex);
    setTempAmpmIndex(ampmIndex);
    setTempMinuteIndex(minuteIndex);
    setShowSchedulePicker(true);
  };

  const confirmScheduleTime = () => {
    setEditPublishHour(from12hTo24(tempHourIndex, tempAmpmIndex));
    setEditPublishMinute([0, 15, 30, 45][tempMinuteIndex]);
    setShowSchedulePicker(false);
  };

  const [leaving, setLeaving] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const currentUserId = user?.id ?? '';
  const isModerator = group?.members.some(
    (m) => m.user_id === currentUserId && m.role === 'moderator'
  ) ?? false;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchGroupDetails(id);
      setGroup(data);
    } catch (_err) {
      setScreenError('We could not load this Group right now. Pull down to try again.');
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my family Group "${group.name}" on Catch Up Column!\nUse invite code: ${group.invite_code}`,
      });
    } catch (_err) {
      // User cancelled share; ignore
    }
  };

  const handleStartEdit = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDescription(group.description ?? '');
    const [hourStr, minuteStr] = group.publish_time.split(':');
    setEditPublishDay(group.publish_day);
    setEditPublishHour(parseInt(hourStr ?? '9', 10));
    setEditPublishMinute(parseInt(minuteStr ?? '0', 10));
    setEditNameError('');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!group) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditNameError('Your Group needs a name.');
      return;
    }
    setEditNameError('');
    setScreenError('');

    try {
      setSaving(true);
      const updated = await updateGroupSettings(group.id, {
        name: trimmedName,
        description: editDescription.trim() || null,
        publish_day: editPublishDay,
        publish_time: `${String(editPublishHour).padStart(2, '0')}:${String(editPublishMinute).padStart(2, '0')}:00`,
      });
      setGroup((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    } catch (_err) {
      setScreenError('Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickCover = async () => {
    if (!group) return;
    setScreenError('');
    try {
      setPickingCover(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const upload = await uploadGroupCover(group.id, asset.uri);
        try {
          await updateGroupSettings(group.id, { cover_image_url: upload.publicUrl });
        } catch (err) {
          // DB write failed after upload — clean up the orphan object so we
          // don't leave dangling storage with no row pointing at it.
          await removeGroupCover(upload.storagePath).catch(() => undefined);
          throw err;
        }
        setGroup((prev) => (prev ? { ...prev, cover_image_url: upload.publicUrl } : prev));
      }
    } catch (_err) {
      setScreenError('Could not update the cover photo. Please try again.');
    } finally {
      setPickingCover(false);
    }
  };

  const handleDeleteGroup = () => {
    if (!group) return;
    Alert.alert(
      `Delete "${group.name}"?`,
      'This will permanently delete the Group, all posts, and all editions for every member. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Group',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingGroup(true);
              await deleteGroup(group.id);
              router.replace('/(tabs)/groups');
            } catch (_err) {
              setScreenError('Could not delete the Group right now. Please try again.');
              setDeletingGroup(false);
            }
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    if (!group) return;
    Alert.alert(
      `Leave "${group.name}"?`,
      "You'll no longer be able to read or write for this Group. A moderator can invite you back.",
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLeaving(true);
              await leaveGroup(group.id, currentUserId);
              router.replace('/(tabs)/groups');
            } catch (err) {
              const message =
                err instanceof Error && err.message.includes('last moderator')
                  ? 'You are the only moderator. Assign someone else as moderator before leaving.'
                  : 'Could not leave the Group right now. Please try again.';
              setScreenError(message);
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <PrintingPressLoading />;
  }

  if (!group) {
    return (
      <ErrorState
        body={screenError || 'Group not found.'}
        onRetry={() => router.replace('/(tabs)/groups')}
        ctaLabel="Back to Groups"
      />
    );
  }

  const memberCount = group.members.length;
  const memberCountLabel = `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;

  return (
    <>
      <Modal
        visible={showSchedulePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSchedulePicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSchedulePicker(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ThemedText variant="label" style={styles.modalTitle}>
              Publish time
            </ThemedText>
            <View style={styles.modalColumns}>
              <SnapColumn
                data={HOURS_12}
                selectedIndex={tempHourIndex}
                onSelect={setTempHourIndex}
                visible={showSchedulePicker}
              />
              <ThemedText variant="body" style={styles.colonSeparator}>:</ThemedText>
              <SnapColumn
                data={MINUTE_ITEMS}
                selectedIndex={tempMinuteIndex}
                onSelect={setTempMinuteIndex}
                visible={showSchedulePicker}
                width={64}
              />
              <SnapColumn
                data={AMPM_ITEMS}
                selectedIndex={tempAmpmIndex}
                onSelect={setTempAmpmIndex}
                visible={showSchedulePicker}
                width={64}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowSchedulePicker(false)} style={styles.modalActionButton}>
                <ThemedText variant="body" style={styles.cancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={confirmScheduleTime} style={[styles.modalActionButton, styles.doneButton]}>
                <ThemedText variant="body" style={styles.doneText}>Done</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
      >
      <Stack.Screen
        options={{
          title: group.name,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <FontAwesome name="chevron-left" size={16} color={Colors.accentNavy} />
            </Pressable>
          ),
        }}
      />
      {screenError ? (
        <StatusBanner variant="error" message={screenError} style={styles.banner} />
      ) : null}

      {/* Cover */}
      {group.cover_image_url ? (
        <AppImage source={{ uri: group.cover_image_url }} style={styles.cover} />
      ) : (
        <View style={styles.coverPlaceholder} />
      )}

      {/* Header */}
      <View style={styles.header}>
        {editing ? (
          <View style={styles.editForm}>
            <FormField
              label="Group name *"
              value={editName}
              onChangeText={(t) => {
                setEditName(t);
                if (editNameError) setEditNameError('');
              }}
              error={editNameError || null}
            />
            <FormField
              label="Description (optional)"
              value={editDescription}
              onChangeText={setEditDescription}
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
                {DAY_LABELS.map((day, index) => (
                  <Pressable
                    key={day}
                    onPress={() => setEditPublishDay(index)}
                    style={[
                      styles.dayButton,
                      editPublishDay === index ? styles.dayButtonActive : null,
                    ]}
                  >
                    <ThemedText
                      variant="caption"
                      style={[
                        styles.dayButtonText,
                        editPublishDay === index ? styles.dayButtonTextActive : null,
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
              <Pressable onPress={openSchedulePicker} style={styles.timeButton}>
                <ThemedText variant="body">
                  {(() => {
                    const h = editPublishHour;
                    const period = h >= 12 ? 'PM' : 'AM';
                    const display = h % 12 === 0 ? 12 : h % 12;
                    return `${display}:${String(editPublishMinute).padStart(2, '0')} ${period}`;
                  })()}
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.editButtons}>
              <FormButton
                title="Save"
                onPress={handleSaveEdit}
                loading={saving}
                style={styles.editButtonHalf}
              />
              <FormButton
                title="Cancel"
                variant="secondary"
                onPress={() => setEditing(false)}
                disabled={saving}
                style={styles.editButtonHalf}
              />
            </View>
            <FormButton
              title={pickingCover ? 'Opening…' : 'Change cover photo'}
              variant="ghost"
              onPress={handlePickCover}
              loading={pickingCover}
            />
          </View>
        ) : (
          <>
            <ThemedText variant="headline" style={styles.columnName}>
              {group.name}
            </ThemedText>
            {group.description ? (
              <ThemedText variant="body" style={styles.columnDescription}>
                {group.description}
              </ThemedText>
            ) : null}
            <ThemedText variant="caption" style={styles.schedule}>
              {formatPublishSchedule(group.publish_day, group.publish_time)}
            </ThemedText>
          </>
        )}
      </View>

      {/* Invite section */}
      <ThemedView variant="card" style={styles.section}>
        <ThemedText variant="label" style={styles.sectionTitle}>
          Invite Code
        </ThemedText>
        <View style={styles.inviteRow}>
          <View style={styles.inviteCodeChip}>
            <ThemedText variant="body" style={styles.inviteCode}>
              {group.invite_code}
            </ThemedText>
          </View>
          <Pressable onPress={handleShare} style={styles.shareButton} accessibilityRole="button">
            <FontAwesome name="share-alt" size={18} color={Colors.accentNavy} />
            <ThemedText variant="label" style={styles.shareText}>
              Share
            </ThemedText>
          </Pressable>
        </View>
        <ThemedText variant="caption" style={styles.inviteHelp}>
          Share this code with family to invite them to your Group.
        </ThemedText>
      </ThemedView>

      {/* Members section */}
      <View style={styles.section}>
        <ThemedText variant="label" style={styles.sectionTitle}>
          Members · {memberCountLabel}
        </ThemedText>
        {group.members.map((m) => (
          <MemberRow
            key={m.user_id}
            displayName={m.user.display_name}
            avatarUrl={m.user.avatar_url}
            role={m.role}
            isCurrentUser={m.user_id === currentUserId}
          />
        ))}
      </View>

      {/* Moderator settings button */}
      {isModerator && !editing ? (
        <View style={styles.section}>
          <FormButton
            title="Edit Group Settings"
            variant="secondary"
            onPress={handleStartEdit}
          />
        </View>
      ) : null}

      {/* Moderator danger zone */}
      {isModerator && !editing ? (
        <View style={[styles.section, styles.dangerZone]}>
          <FormButton
            title="Delete this Group"
            variant="destructive"
            onPress={handleDeleteGroup}
            loading={deletingGroup}
          />
        </View>
      ) : null}

      {/* Leave */}
      {!isModerator ? (
        <View style={[styles.section, styles.dangerZone]}>
          <FormButton
            title="Leave this Group"
            variant="ghost"
            onPress={handleLeave}
            loading={leaving}
            style={styles.leaveButton}
          />
        </View>
      ) : null}
    </ScrollView>
    </>
  );
};

export default GroupDetailScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Layout.padding.xl,
  },
  backButton: {
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.sm,
    minWidth: Layout.touchTargetMin,
    minHeight: Layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    margin: Layout.padding.md,
  },
  cover: {
    width: '100%',
    height: 180,
  },
  coverPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.backgroundWarm,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.lg,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: Layout.padding.sm,
  },
  columnName: {
    fontFamily: Typography.families.serifBold,
    color: Colors.text,
  },
  columnDescription: {
    color: Colors.textMuted,
    lineHeight: Typography.lineHeights.body,
  },
  schedule: {
    color: Colors.textMuted,
    marginTop: Layout.padding.xs,
  },
  editForm: {
    gap: Layout.padding.md,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    width: '100%',
    maxWidth: 320,
    marginHorizontal: Layout.padding.lg,
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
  editButtons: {
    flexDirection: 'row',
    gap: Layout.padding.sm,
  },
  editButtonHalf: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: Layout.padding.sm,
  },
  sectionTitle: {
    color: Colors.accentNavy,
    marginBottom: Layout.padding.xs,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  inviteCodeChip: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.sm,
  },
  inviteCode: {
    fontFamily: Typography.families.sansBold,
    letterSpacing: 2,
    color: Colors.accentNavy,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.xs,
    minHeight: Layout.touchTargetMin,
    paddingHorizontal: Layout.padding.md,
  },
  shareText: {
    color: Colors.accentNavy,
  },
  inviteHelp: {
    color: Colors.textMuted,
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 0,
    marginTop: Layout.padding.lg,
  },
  leaveButton: {
    borderColor: Colors.error,
  },
});
