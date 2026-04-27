import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { FormButton } from '@/components/form-button';
import { GroupCard } from '@/components/group-card';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { fetchUserGroups } from '@/lib/groups';
import type { GroupWithMembers } from '@/types';

const GroupsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setScreenError('');
    try {
      const data = await fetchUserGroups(user.id);
      setGroups(data);
    } catch (_err) {
      setScreenError('Could not load your Groups. Pull down to try again.');
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.actionBar}>
        <FormButton
          title="Create"
          onPress={() => router.push('/group/create')}
          style={styles.actionButton}
        />
        <FormButton
          title="Join"
          variant="secondary"
          onPress={() => router.push('/group/join')}
          style={styles.actionButton}
        />
      </View>

      {screenError ? (
        <StatusBanner variant="error" message={screenError} style={styles.banner} />
      ) : null}

      {!loading && groups.length === 0 && !screenError ? (
        <View style={styles.emptyState}>
          <ThemedText variant="subheadline" style={styles.emptyTitle}>
            No Groups yet
          </ThemedText>
          <ThemedText variant="body" style={styles.emptyBody}>
            Create a Group to start your family newsletter, or ask someone for their invite code to join theirs.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => router.push(`/group/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
            />
          }
          style={styles.flex}
          contentContainerStyle={groups.length === 0 ? styles.flex : undefined}
        />
      )}
    </View>
  );
};

export default GroupsScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  actionBar: {
    flexDirection: 'row',
    gap: Layout.padding.sm,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  actionButton: {
    flex: 1,
  },
  banner: {
    margin: Layout.padding.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.padding.xl,
    gap: Layout.padding.md,
  },
  emptyTitle: {
    fontFamily: Typography.families.serifBold,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
  },
});
