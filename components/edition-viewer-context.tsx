import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { fetchMyRole } from '@/lib/groups';

// Who is reading an edition, as the foot of each story needs to know it: is
// this their own story (no Report, no Block), do they run the Group (Take
// down), and what the screen does once a story has been taken down or its
// writer blocked. Provided by both edition screens, so it reaches a story
// inside the enlarge overlay's Modal without threading props through the
// reader.
export type EditionViewer = {
  viewerId: string | null;
  isModerator: boolean;
  // For the take-down confirmation ("for everyone in {group}"); '' until known.
  groupName: string;
  onStoryRemoved: (postId: string) => void;
  // The reader blocked this writer: every story of theirs leaves the page at
  // once, not only the one the reader was on.
  onAuthorBlocked: (authorId: string) => void;
};

// Outside a provider nobody is a moderator and there is no reader, so a story
// rendered anywhere else never offers a take-down or a block.
const EditionViewerContext = createContext<EditionViewer>({
  viewerId: null,
  isModerator: false,
  groupName: '',
  onStoryRemoved: () => {},
  onAuthorBlocked: () => {},
});

export const useEditionViewer = (): EditionViewer => useContext(EditionViewerContext);

type ProviderProps = {
  groupId: string;
  groupName: string;
  onStoryRemoved: (postId: string) => void;
  onAuthorBlocked: (authorId: string) => void;
  children: ReactNode;
};

// Looks up the reader's role once the edition is on screen. Until it lands,
// or if it fails, they read as a contributor: the take-down line appears a
// moment later, or not at all. The RPC checks the role again regardless.
export const EditionViewerProvider = ({
  groupId,
  groupName,
  onStoryRemoved,
  onAuthorBlocked,
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
    () => ({ viewerId, isModerator, groupName, onStoryRemoved, onAuthorBlocked }),
    [viewerId, isModerator, groupName, onStoryRemoved, onAuthorBlocked],
  );

  return <EditionViewerContext.Provider value={value}>{children}</EditionViewerContext.Provider>;
};
