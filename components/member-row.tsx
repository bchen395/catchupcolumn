import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import type { GroupMemberRow } from '@/types';

// A §9 chip under the name. Today that's the member's role; any other state
// a row needs to show goes in the same list. `strong` is the ink-outlined,
// SemiBold voice the moderator tag speaks in; everything else stays quiet.
export type MemberRowTag = {
  label: string;
  strong?: boolean;
};

// A quiet text action at the row's right edge — never a button (BRAND §9 →
// Moderation affordances). `destructive` speaks in `error`, never vermilion;
// anything else in ink. A row can carry several, stacked.
export type MemberRowAction = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  destructive?: boolean;
};

type MemberRowProps = {
  name: string;
  avatarUrl: string | null;
  isCurrentUser?: boolean;
  tags?: MemberRowTag[];
  // Omit (or pass []) for a read-only row.
  actions?: MemberRowAction[];
};

export const roleTag = (role: GroupMemberRow['role']): MemberRowTag =>
  role === 'moderator'
    ? { label: Strings.members.moderator, strong: true }
    : { label: Strings.members.contributor };

// Matches the circle the group-detail skeleton draws.
const AVATAR_SIZE = 44;

// One person on the Group page: face, name, chips, and whatever the viewer
// may do about them. Shared by the member list and the moderator's Removed
// list, so the two always line up.
export const MemberRow = ({
  name,
  avatarUrl,
  isCurrentUser = false,
  tags = [],
  actions = [],
}: MemberRowProps) => (
  <View style={styles.row}>
    <Avatar uri={avatarUrl} name={name} size={AVATAR_SIZE} />
    <View style={styles.info}>
      <ThemedText variant="body" style={styles.name}>
        {name}
        {isCurrentUser ? Strings.members.you : ''}
      </ThemedText>
      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View key={tag.label} style={[styles.tag, tag.strong ? styles.tagStrong : null]}>
              <ThemedText
                variant="caption"
                style={tag.strong ? styles.tagStrongText : styles.tagText}
              >
                {tag.label}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
    {actions.length > 0 ? (
      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <ThemedText
              variant="caption"
              style={[styles.actionLabel, action.destructive ? styles.destructive : null]}
            >
              {action.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    minHeight: Layout.rowMinHeight,
    paddingVertical: Layout.padding.sm,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: Typography.families.sansMedium,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.padding.xs,
  },
  // Outlined hairline pills, no fills (§9). The moderator tag speaks with an
  // ink outline + SemiBold; contributors stay quiet.
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.padding.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
  },
  tagStrong: {
    borderColor: Colors.ink,
  },
  tagStrongText: {
    color: Colors.ink,
    fontFamily: Typography.families.sansSemiBold,
  },
  tagText: {
    color: Colors.inkSoft,
  },
  // Quiet by color and placement, never by shrinking below the 48px floor.
  actions: {
    alignItems: 'flex-end',
  },
  action: {
    minHeight: Layout.touchTargetMin,
    justifyContent: 'center',
    paddingLeft: Layout.padding.md,
  },
  actionPressed: {
    opacity: 0.6,
  },
  actionLabel: {
    color: Colors.ink,
    fontFamily: Typography.families.sansSemiBold,
  },
  destructive: {
    color: Colors.error,
  },
});
