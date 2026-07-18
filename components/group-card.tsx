import { Pressable, StyleSheet, View } from 'react-native';

import { AppImage } from '@/components/app-image';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import type { GroupWithMembers } from '@/types';

type GroupCardProps = {
  group: GroupWithMembers;
  onPress: () => void;
};

// A Group as a §6 list row: `rowTitle` headline left, square hairline-edged
// cover right, meta folio below — hairline-separated, whole row the target,
// no chevron. (No placeholder art when a Group has no cover; the rule
// carries the structure.)
export const GroupCard = ({ group, onPress }: GroupCardProps) => {
  const memberCount = group.members.length;
  const memberLabel = `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.content}>
        <ThemedText variant="rowTitle" numberOfLines={1}>
          {group.name}
        </ThemedText>
        {group.description ? (
          <ThemedText variant="ui" style={styles.description} numberOfLines={1}>
            {group.description}
          </ThemedText>
        ) : null}
        <ThemedText variant="meta">{memberLabel}</ThemedText>
      </View>
      {group.cover_image_url ? (
        <AppImage source={{ uri: group.cover_image_url }} style={styles.thumbnail} />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.rowMinHeight,
    paddingVertical: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    borderBottomWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    gap: Layout.padding.md,
  },
  pressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  description: {
    color: Colors.inkSoft,
  },
});
