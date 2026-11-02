import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchMyBlockedIds, unblockMember } from '@/lib/blocks';

/**
 * Who the signed-in person has blocked, for the "Blocked" chip and "Unblock"
 * on the Group page's member rows. Read again whenever the page comes into
 * focus, since blocking happens in an edition, on another screen.
 */
export const useMyBlocks = (userId: string) => {
  const [blockedIds, setBlockedIds] = useState<ReadonlySet<string>>(() => new Set());

  // Never throws: the chips are secondary, so a failed read keeps what's
  // shown and pull to refresh tries again.
  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      setBlockedIds(new Set(await fetchMyBlockedIds(userId)));
    } catch (_err) {
      // Keep what's shown.
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  // Throws, for the screen's error banner. The chip goes once the server has
  // lifted the block.
  const unblock = useCallback(
    async (blockedId: string) => {
      await unblockMember(userId, blockedId);
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(blockedId);
        return next;
      });
    },
    [userId],
  );

  return { blockedIds, reload, unblock };
};
