import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { ensureUserProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Stale/invalid token — clear it so the user is sent to login
        supabase.auth.signOut();
        setSession(null);
      } else {
        if (session?.user) {
          ensureUserProfile(session.user);
        }
        setSession(session);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        ensureUserProfile(session.user);
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
};
