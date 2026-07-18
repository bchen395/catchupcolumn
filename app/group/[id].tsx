import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import { AppImage } from '@/components/app-image';
import { DaySelector } from '@/components/day-selector';
import { ErrorState } from '@/components/error-state';
import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { InviteFamilyCard } from '@/components/invite-family-card';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StatusBanner } from '@/components/status-banner';
import { TimeField } from '@/components/time-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { PublishNowError, publishEditionNow } from '@/lib/editions';
import {
    deleteGroup,
    fetchGroupDetails,
    leaveGroup,
    removeGroupCover,
    updateGroupSettings,
    uploadGroupCover,
} from '@/lib/groups';
import type { GroupWithMembers } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
    backgroundColor: Colors.hairline,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.ink,
    fontFamily: Typography.families.sansBold,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: Typography.families.sansMedium,
  },
  // Role tags as §9 chips: outlined hairline pills, no fills. The moderator
  // tag speaks with an ink outline + SemiBold; contributors stay quiet.
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.padding.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  badgeMod: {
    borderColor: Colors.ink,
  },
  badgeModText: {
    color: Colors.ink,
    fontFamily: Typography.families.sansSemiBold,
  },
  badgeContribText: {
    color: Colors.inkSoft,
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

  const [leaving, setLeaving] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [publishingNow, setPublishingNow] = useState(false);

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
              router.replace('/groups');
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
              router.replace('/groups');
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

  const handlePublishNow = () => {
    if (!group) return;
    Alert.alert(
      'Send this week’s edition now?',
      `Everyone in ${group.name} will get the edition right away. Your next regular edition still goes out ${formatPublishSchedule(group.publish_day, group.publish_time).toLowerCase()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'default',
          onPress: async () => {
            setScreenError('');
            try {
              setPublishingNow(true);
              const result = await publishEditionNow(group.id);
              router.replace(`/edition/${result.editionId}`);
            } catch (err) {
              if (err instanceof PublishNowError) {
                if (err.code === 'no_posts_to_publish') {
                  Alert.alert(
                    'Nothing to publish yet',
                    'There aren’t any posts for this edition yet. Ask your group to write something first.',
                  );
                } else if (err.code === 'not_moderator') {
                  setScreenError('Only moderators can publish editions.');
                } else if (err.code === 'publish_in_progress') {
                  setScreenError('An edition is already being published. Try again in a moment.');
                } else {
                  setScreenError('Could not publish this edition right now. Please try again.');
                }
              } else {
                setScreenError('Could not publish this edition right now. Please try again.');
              }
              setPublishingNow(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <PrintingPressLoading />;
  }

  // Publishing compiles and delivers the edition — the one true long wait in
  // the app, so the printing press runs (BRAND §4/§10).
  if (publishingNow) {
    return <PrintingPressLoading variant="press" message={Strings.loading.publishing} />;
  }

  if (!group) {
    return (
      <ErrorState
        body={screenError || 'Group not found.'}
        onRetry={() => router.replace('/groups')}
        ctaLabel="Back to Groups"
      />
    );
  }

  const memberCount = group.members.length;
  const memberCountLabel = `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.ink} />}
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
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={26} color={Colors.ink} />
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
            <DaySelector value={editPublishDay} onChange={setEditPublishDay} />

            <TimeField
              hour24={editPublishHour}
              minute={editPublishMinute}
              onChange={(h, m) => {
                setEditPublishHour(h);
                setEditPublishMinute(m);
              }}
            />
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
      <View style={styles.section}>
        <InviteFamilyCard groupName={group.name} inviteCode={group.invite_code} />
      </View>

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

      {/* Moderator: publish this week's edition immediately */}
      {isModerator && !editing ? (
        <ThemedView variant="card" style={styles.section}>
          <ThemedText variant="label" style={styles.sectionTitle}>
            Publish this week’s edition
          </ThemedText>
          <ThemedText variant="caption" style={styles.publishNowHelp}>
            Send everything written so far to all members now. Your next
            regular edition still goes out on schedule.
          </ThemedText>
          <FormButton
            title={publishingNow ? 'Publishing…' : 'Publish now'}
            onPress={handlePublishNow}
            loading={publishingNow}
          />
        </ThemedView>
      ) : null}

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
    backgroundColor: Colors.paperWarm,
  },
  scroll: {
    paddingBottom: Layout.padding.xl,
  },
  backButton: {
    marginLeft: 4,
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
    backgroundColor: Colors.hairline,
    borderBottomWidth: 1,
    borderColor: Colors.hairline,
  },
  header: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.lg,
    borderBottomWidth: 1,
    borderColor: Colors.hairline,
    gap: Layout.padding.sm,
  },
  columnName: {
    fontFamily: Typography.families.serifBold,
    color: Colors.ink,
  },
  columnDescription: {
    color: Colors.inkSoft,
    lineHeight: Typography.lineHeights.body,
  },
  schedule: {
    color: Colors.inkSoft,
    marginTop: Layout.padding.xs,
  },
  editForm: {
    gap: Layout.padding.md,
  },
  multilineInput: {
    minHeight: Layout.input.multilineMinHeight,
    paddingTop: Layout.input.paddingV,
    textAlignVertical: 'top',
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
    borderColor: Colors.hairline,
    gap: Layout.padding.sm,
  },
  sectionTitle: {
    color: Colors.ink,
    marginBottom: Layout.padding.xs,
  },
  publishNowHelp: {
    color: Colors.inkSoft,
    lineHeight: Typography.lineHeights.body,
    marginBottom: Layout.padding.xs,
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    borderBottomWidth: 0,
    marginTop: Layout.padding.lg,
  },
  leaveButton: {
    borderColor: Colors.error,
  },
});
