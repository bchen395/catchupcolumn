import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppImage } from '@/components/app-image';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import type { GroupWithMembers } from '@/types';

type GroupCardProps = {
  group: GroupWithMembers;
  onPress: () => void;
};

export const GroupCard = ({ group, onPress }: GroupCardProps) => {
  const memberCount = group.members.length;
  const memberLabel = `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      {group.cover_image_url ? (
        <AppImage source={{ uri: group.cover_image_url }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <FontAwesome name="newspaper-o" size={20} color={Colors.textMuted} />
        </View>
      )}
      <View style={styles.content}>
        <ThemedText variant="body" style={styles.name} numberOfLines={1}>
          {group.name}
        </ThemedText>
        {group.description ? (
          <ThemedText variant="caption" style={styles.description} numberOfLines={1}>
            {group.description}
          </ThemedText>
        ) : null}
        <ThemedText variant="caption" style={styles.meta}>
          {memberLabel}
        </ThemedText>
      </View>
      <FontAwesome name="chevron-right" size={14} color={Colors.textMuted} style={styles.chevron} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.touchTargetMin * 1.5,
    paddingVertical: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: Layout.padding.md,
  },
  pressed: {
    backgroundColor: Colors.backgroundWarm,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: Layout.borderRadius.md,
  },
  thumbnailPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: Typography.families.sansSemiBold,
    color: Colors.text,
  },
  description: {
    color: Colors.textMuted,
  },
  meta: {
    color: Colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    marginLeft: Layout.padding.sm,
  },
});
