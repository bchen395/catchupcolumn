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
        try {
          await ensureUserProfile(next.user);
        } catch (err) {
          console.warn('ensureUserProfile failed during auth init', err);
        }
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
