import type { Session } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';

import { ensureUserProfile } from '@/lib/auth';
import { registerForPushAsync } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let initialised = false;

    const handleSession = async (next: Session | null) => {
      if (!mounted) return;

      const userId = next?.user?.id ?? null;
      const userChanged = userId !== lastUserIdRef.current;

      if (next?.user && userChanged) {
        // ensureUserProfile throws on RLS/network failure; downstream screens
        // join on users.id, so retry once before giving up rather than dropping
        // a freshly signed-in user into a profile-less, half-broken state.
        try {
          await ensureUserProfile(next.user);
        } catch (firstErr) {
          try {
            await ensureUserProfile(next.user);
          } catch (retryErr) {
            console.warn('ensureUserProfile failed during auth init', retryErr ?? firstErr);
          }
        }
        if (!mounted) return;
        registerForPushAsync(next.user.id);
      }

      lastUserIdRef.current = userId;
      if (!mounted) return;
      setSession(next);
      if (!initialised) {
        initialised = true;
        setLoading(false);
      }
    };

    // onAuthStateChange fires INITIAL_SESSION on subscribe, so it covers cold
    // start without a separate getSession() call (which would race with it).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      void handleSession(next);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, user: session?.user ?? null };
};
