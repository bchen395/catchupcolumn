import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { FormButton } from '@/components/form-button';
import { GroupCard } from '@/components/group-card';
import { DogWithPaperScene } from '@/components/illustrations/dog-with-paper-scene';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StatusBanner } from '@/components/status-banner';
import { Colors } from '@/constants/colors';
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
          scene={<DogWithPaperScene />}
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
              tintColor={Colors.ink}
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
    backgroundColor: Colors.paperWarm,
  },
  actionBar: {
    flexDirection: 'row',
    gap: Layout.padding.sm,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    borderBottomWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paperWarm,
  },
  actionButton: {
    flex: 1,
  },
  banner: {
    margin: Layout.padding.md,
  },
});
