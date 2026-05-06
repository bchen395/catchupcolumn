import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { FormButton } from '@/components/form-button';
import { GroupCard } from '@/components/group-card';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StatusBanner } from '@/components/status-banner';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
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
      setScreenError(Strings.error.groupsLoad);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

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

      {loading ? (
        <PrintingPressLoading />
      ) : !loading && groups.length === 0 && !screenError ? (
        <EmptyState
          icon={Icons.emptyGroups}
          title={Strings.empty.groups.title}
          body={Strings.empty.groups.body}
        />
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
});
