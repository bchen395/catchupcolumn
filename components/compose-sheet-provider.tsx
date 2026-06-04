import { useRouter } from 'expo-router';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

import { useAuth } from '@/hooks/use-auth';
import { fetchUserGroups } from '@/lib/groups';
import type { GroupWithMembers } from '@/types';

import { ComposeGroupSheet } from './compose-group-sheet';

type ComposeSheetContextValue = {
  /** The signed-in user's groups, shared with the compose screen. */
  groups: GroupWithMembers[];
  loadingGroups: boolean;
  /** Open the "write for…" flow. Skips the sheet when there's a single group. */
  openComposeSheet: () => void;
  /** Re-fetch groups (e.g. on pull-to-refresh). */
  reloadGroups: () => Promise<void>;
};

const ComposeSheetContext = createContext<ComposeSheetContextValue | null>(null);

export const useComposeSheet = (): ComposeSheetContextValue => {
  const ctx = useContext(ComposeSheetContext);
  if (!ctx) {
    throw new Error('useComposeSheet must be used within a ComposeSheetProvider');
  }
  return ctx;
};

export const ComposeSheetProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);

  const reloadGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoadingGroups(false);
      return;
    }
    try {
      const data = await fetchUserGroups(user.id);
      setGroups(data);
    } catch {
      // Keep the last-known list; the compose screen surfaces load errors.
    } finally {
      setLoadingGroups(false);
    }
  }, [user]);

  useEffect(() => {
    setLoadingGroups(true);
    reloadGroups();
  }, [reloadGroups]);

  const goToCompose = useCallback(
    (groupId: string) => {
      router.navigate({ pathname: '/(tabs)/post', params: { groupId } });
    },
    [router],
  );

  // Skip-when-possible: one group goes straight to Compose; zero or many open
  // the sheet (with an empty-state prompt or the list).
  const openComposeSheet = useCallback(() => {
    if (!loadingGroups && groups.length === 1) {
      goToCompose(groups[0].id);
      return;
    }
    setSheetVisible(true);
  }, [loadingGroups, groups, goToCompose]);

  // If the sheet was opened while groups were still loading and it resolves to
  // a single group, honor skip-when-possible and jump straight to Compose.
  useEffect(() => {
    if (sheetVisible && !loadingGroups && groups.length === 1) {
      setSheetVisible(false);
      goToCompose(groups[0].id);
    }
  }, [sheetVisible, loadingGroups, groups, goToCompose]);

  const handleSelect = useCallback(
    (groupId: string) => {
      setSheetVisible(false);
      goToCompose(groupId);
    },
    [goToCompose],
  );

  const handleCreateOrJoin = useCallback(() => {
    setSheetVisible(false);
    router.push('/groups');
  }, [router]);

  return (
    <ComposeSheetContext.Provider
      value={{ groups, loadingGroups, openComposeSheet, reloadGroups }}
    >
      {children}
      <ComposeGroupSheet
        visible={sheetVisible}
        groups={groups}
        loading={loadingGroups}
        onSelect={handleSelect}
        onClose={() => setSheetVisible(false)}
        onCreateOrJoin={handleCreateOrJoin}
      />
    </ComposeSheetContext.Provider>
  );
};
