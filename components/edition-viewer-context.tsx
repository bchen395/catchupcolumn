import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { fetchMyRole } from '@/lib/groups';

// Who is reading an edition, as the foot of each story needs to know it: is
// this their own story (no Report), do they run the Group (Take down), and
// what the screen does once a story has been taken down. Provided by both
// edition screens, so it reaches a story inside the enlarge overlay's Modal
// without threading props through the reader.
export type EditionViewer = {
  viewerId: string | null;
  isModerator: boolean;
  // For the take-down confirmation ("for everyone in {group}"); '' until known.
  groupName: string;
  onStoryRemoved: (postId: string) => void;
};

// Outside a provider nobody is a moderator, so a story rendered anywhere else
// never offers a take-down.
const EditionViewerContext = createContext<EditionViewer>({
  viewerId: null,
  isModerator: false,
  groupName: '',
  onStoryRemoved: () => {},
});

export const useEditionViewer = (): EditionViewer => useContext(EditionViewerContext);

type ProviderProps = {
  groupId: string;
  groupName: string;
  onStoryRemoved: (postId: string) => void;
  children: ReactNode;
};

// Looks up the reader's role once the edition is on screen. Until it lands,
// or if it fails, they read as a contributor: the take-down line appears a
// moment later, or not at all. The RPC checks the role again regardless.
export const EditionViewerProvider = ({
  groupId,
  groupName,
  onStoryRemoved,
  children,
}: ProviderProps) => {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (!viewerId) return;
    let cancelled = false;
    fetchMyRole(groupId, viewerId)
      .then((role) => {
        if (!cancelled) setIsModerator(role === 'moderator');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [groupId, viewerId]);

  const value = useMemo(
    () => ({ viewerId, isModerator, groupName, onStoryRemoved }),
    [viewerId, isModerator, groupName, onStoryRemoved],
  );

  return <EditionViewerContext.Provider value={value}>{children}</EditionViewerContext.Provider>;
};
