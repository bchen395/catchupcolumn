import type { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ensureUserProfile, fetchCurrentUserProfile, needsOnboarding } from '@/lib/auth';
import { registerForPushAsync } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

// Makes sure the signed-in user has a public.users row, and answers whether
// it's safe to let them into the app. Downstream screens join on users.id, so
// an account without its row is half-broken (bugs.md L3).
//
// ensureUserProfile throws on RLS/network failure, so it gets a second try.
// If both fail, the answer depends on whether the row is there anyway:
// - Readable and present: a returning user on a flaky network. Harmless.
// - Readable and missing: block, so the app can offer a retry.
// - Unreadable (the network is down): we can't tell, so guess from the
//   account. A brand-new one, still owing onboarding, almost certainly has no
//   row, so block it. A returning one almost certainly does, and blocking it
//   would lock people out of their own paper over a bad signal — exactly the
//   auto-sign-out this hook has always refused to do.
const settleProfile = async (user: User): Promise<boolean> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await ensureUserProfile(user);
      return true;
    } catch (err) {
      lastError = err;
    }
  }
  console.warn('ensureUserProfile failed during auth init', lastError);

  try {
    return (await fetchCurrentUserProfile(user.id)) !== null;
  } catch {
    return !needsOnboarding(user);
  }
};

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // True while the signed-in user has no profile row we could create. The
  // root layout shows a retry screen instead of the app (bugs.md L3).
  const [profileError, setProfileError] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let initialised = false;

    const handleSession = async (next: Session | null) => {
      if (!mountedRef.current) return;

      const userId = next?.user?.id ?? null;
      const userChanged = userId !== lastUserIdRef.current;
      let profileOk = true;

      if (next?.user && userChanged) {
        profileOk = await settleProfile(next.user);
        if (!mountedRef.current) return;
        // push_tokens.user_id references users.id, so a token can only be
        // saved once the row exists; retryProfile registers it on success.
        if (profileOk) registerForPushAsync(next.user.id);
      }

      lastUserIdRef.current = userId;
      if (!mountedRef.current) return;
      // Same tick as setSession, so no render ever pairs the new user with
      // the previous user's profile state.
      if (userChanged) setProfileError(!profileOk);
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
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // The retry screen's "Try again". Resolves either way; profileError says
  // how it went.
  const retryProfile = useCallback(async () => {
    const user = session?.user;
    if (!user) return;
    const ok = await settleProfile(user);
    // Signed out (or switched accounts) while the retry was in flight — the
    // answer belongs to someone who's no longer here.
    if (!mountedRef.current || lastUserIdRef.current !== user.id) return;
    setProfileError(!ok);
    if (ok) registerForPushAsync(user.id);
  }, [session]);

  return { session, loading, user: session?.user ?? null, profileError, retryProfile };
};
