import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { MemberRow } from '@/components/member-row';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { unbanGroupMember } from '@/lib/groups';
import type { GroupBanWithUser } from '@/types';

type RemovedMembersProps = {
  groupId: string;
  // fetchGroupBans. The screen renders this for moderators only, and RLS
  // returns no rows to anyone else.
  bans: GroupBanWithUser[];
  // Called once a removal is lifted, so the screen can drop the row.
  onLetBackIn: (userId: string) => void;
  // Feeds the screen's error banner; '' clears it.
  onError: (message: string) => void;
};

// The moderator's list of people removed from this Group, each with "Let
// back in" (BRAND §9 → Moderation affordances). Absent until someone has been
// removed. Letting someone back in only lifts the removal — they rejoin with
// the invite code if they choose to; nobody is re-added on their behalf.
export const RemovedMembers = ({ groupId, bans, onLetBackIn, onError }: RemovedMembersProps) => {
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (bans.length === 0) return null;

  const letBackIn = async (ban: GroupBanWithUser) => {
    onError('');
    try {
      setPendingId(ban.user_id);
      await unbanGroupMember(groupId, ban.user_id);
      onLetBackIn(ban.user_id);
    } catch (err) {
      onError(
        err instanceof Error && err.message === 'not_moderator'
          ? Strings.members.letBackInNotModerator
          : Strings.members.letBackInFailed(ban.user.display_name),
      );
    } finally {
      setPendingId(null);
    }
  };

  const confirm = (ban: GroupBanWithUser) => {
    const name = ban.user.display_name;
    Alert.alert(Strings.members.letBackInTitle(name), Strings.members.letBackInBody(name), [
      { text: Strings.members.cancel, style: 'cancel' },
      { text: Strings.members.letBackIn, onPress: () => void letBackIn(ban) },
    ]);
  };

  return (
    <View style={styles.section}>
      <ThemedText variant="label" style={styles.title}>
        {Strings.members.removedTitle(bans.length)}
      </ThemedText>
      {bans.map((ban) => (
        <MemberRow
          key={ban.user_id}
          name={ban.user.display_name}
          avatarUrl={ban.user.avatar_url}
          // One change at a time, like Remove on the member list.
          actions={
            pendingId
              ? []
              : [
                  {
                    label: Strings.members.letBackIn,
                    accessibilityLabel: Strings.members.a11yLetBackIn(ban.user.display_name),
                    onPress: () => confirm(ban),
                  },
                ]
          }
        />
      ))}
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
