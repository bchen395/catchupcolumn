import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getPendingInvite, type PendingInvite } from '@/lib/pending-invite';

// Read the pending invite for the auth screens' "Joining {name}" banner.
// Re-reads on focus so hopping between login and signup stays fresh.
export const usePendingInvite = () => {
  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPendingInvite()
        .then((value) => {
          if (active) setInvite(value);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return { invite, loading };
};
