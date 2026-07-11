import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { fetchInvitePreviewDetails, joinGroupByInviteCode } from '@/lib/groups';
import { clearPendingInvite, getPendingInvite } from '@/lib/pending-invite';

// Consumes a pending invite once the user is signed in and past onboarding:
// join the Group they accepted before signup and land them on the welcome
// celebration. Mounted once in the root layout — it must also fire for an
// existing user who signs IN (no onboarding step ever runs), which is why
// this doesn't live in onboarding's completion handler.
export const useAutoJoinInvite = (
  session: Session | null,
  requiresOnboarding: boolean,
  ready: boolean,
): { consumingInvite: boolean; holdAuthRedirect: boolean } => {
  const router = useRouter();
  // Key everything on the user id, not the session object: onboarding
  // completion fires USER_UPDATED and TOKEN_REFRESHED back-to-back, each with
  // a fresh session identity — an identity-keyed effect would cancel the join
  // mid-flight on the second event.
  const userId = session?.user?.id ?? null;
  const [consumingInvite, setConsumingInvite] = useState(false);
  // Which user's pending-invite check has finished (found-or-not). Until it
  // has, holdAuthRedirect keeps the root gate from bouncing (auth) → home
  // underneath us.
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!ready || !userId || requiresOnboarding) return;
    if (checkedUserId === userId || runningRef.current) return;
    runningRef.current = true;

    const run = async () => {
      try {
        const invite = await getPendingInvite();
        if (!invite) return;

        setConsumingInvite(true);
        try {
          const details = await fetchInvitePreviewDetails(invite.code);

          if (!details) {
            // Revoked or mistyped — hand the code back to the join screen so
            // its friendly "couldn't find that Group" state explains it.
            await clearPendingInvite();
            router.replace({ pathname: '/group/join', params: { code: invite.code } });
            return;
          }

          if (details.is_member) {
            await clearPendingInvite();
            router.replace(`/group/${details.group_id}`);
            return;
          }

          const groupId = await joinGroupByInviteCode(invite.code);
          await clearPendingInvite();
          router.replace({
            pathname: '/group/welcome',
            params: {
              groupId,
              groupName: details.name,
              publishDay: String(details.publish_day),
              publishTime: details.publish_time,
              timezone: details.timezone,
            },
          });
        } catch (err) {
          if (err instanceof Error && err.message === 'invalid_invite_code') {
            await clearPendingInvite();
            router.replace({ pathname: '/group/join', params: { code: invite.code } });
          }
          // Anything else (network, server) keeps the pending invite so the
          // next cold start retries.
        }
      } finally {
        // Unconditional: a stuck-true consumingInvite would pin the root
        // layout's loading overlay over the whole app.
        runningRef.current = false;
        setConsumingInvite(false);
        setCheckedUserId(userId);
      }
    };

    void run();
  }, [ready, userId, requiresOnboarding, checkedUserId, router]);

  // True from the first eligible render until this user's check resolves —
  // derived synchronously so the gate can't redirect during the async gap
  // before consumingInvite flips true.
  const holdAuthRedirect =
    consumingInvite || (ready && !!userId && !requiresOnboarding && checkedUserId !== userId);

  return { consumingInvite, holdAuthRedirect };
};
