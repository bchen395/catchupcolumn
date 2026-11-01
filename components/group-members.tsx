import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  MemberRow,
  roleTag,
  type MemberRowAction,
  type MemberRowTag,
} from '@/components/member-row';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { firstName } from '@/lib/edition-layout';
import type { GroupWithMembers } from '@/types';

type Member = GroupWithMembers['members'][number];

type GroupMembersProps = {
  members: Member[];
  currentUserId: string;
  // Remove on everyone else's row: moderators only, one removal at a time.
  canRemove: boolean;
  // The screen confirms and runs the removal; it owns the roster.
  onRemove: (userId: string, name: string) => void;
  // Who the reader has blocked (useMyBlocks). Only they ever see these.
  blockedIds: ReadonlySet<string>;
  onUnblock: (userId: string) => Promise<void>;
  // Feeds the screen's error banner; '' clears it.
  onError: (message: string) => void;
};

// The Group page's "Members · {n}" section: one member-row per person, with
// their role, and — for the reader's eyes only — a "Blocked" chip and
// "Unblock" on anyone they've blocked (BRAND §9 → Moderation affordances).
// Unblock is quiet ink like "Let back in": it brings stories back and
// destroys nothing. A moderator's Remove sits beside it in `error`.
export const GroupMembers = ({
  members,
  currentUserId,
  canRemove,
  onRemove,
  blockedIds,
  onUnblock,
  onError,
}: GroupMembersProps) => {
  const [unblocking, setUnblocking] = useState(false);

  const unblock = async (member: Member) => {
    onError('');
    setUnblocking(true);
    try {
      await onUnblock(member.user_id);
    } catch (_err) {
      onError(Strings.block.failed);
    } finally {
      setUnblocking(false);
    }
  };

  const confirmUnblock = (member: Member) => {
    const name = firstName(member.user.display_name);
    Alert.alert(Strings.block.unblockTitle(name), Strings.block.unblockBody(name), [
      { text: Strings.block.cancel, style: 'cancel' },
      { text: Strings.block.unblock, onPress: () => void unblock(member) },
    ]);
  };

  return (
    <View style={styles.section}>
      <ThemedText variant="label" style={styles.title}>
        {Strings.members.title(members.length)}
      </ThemedText>
      {members.map((m) => {
        const isYou = m.user_id === currentUserId;
        const blocked = !isYou && blockedIds.has(m.user_id);
        const tags: MemberRowTag[] = [roleTag(m.role)];
        const actions: MemberRowAction[] = [];
        if (blocked) {
          tags.push({ label: Strings.block.tag });
          // One unblock at a time, like Remove.
          if (!unblocking) {
            actions.push({
              label: Strings.block.unblock,
              accessibilityLabel: Strings.block.a11yUnblock(m.user.display_name),
              onPress: () => confirmUnblock(m),
            });
          }
        }
        if (canRemove && !isYou) {
          actions.push({
            label: Strings.members.remove,
            accessibilityLabel: Strings.members.a11yRemove(m.user.display_name),
            onPress: () => onRemove(m.user_id, m.user.display_name),
            destructive: true,
          });
        }
        return (
          <MemberRow
            key={m.user_id}
            name={m.user.display_name}
            avatarUrl={m.user.avatar_url}
            isCurrentUser={isYou}
            tags={tags}
            actions={actions}
          />
        );
      })}
    </View>
  );
};

// The same band as the Group page's other sections (app/group/[id].tsx).
const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    borderBottomWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    gap: Layout.padding.sm,
  },
  title: {
    color: Colors.ink,
    marginBottom: Layout.padding.xs,
  },
});
