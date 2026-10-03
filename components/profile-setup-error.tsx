import { useState } from 'react';

import { Icons } from '@/constants/icons';
import { Strings } from '@/constants/strings';
import { signOut } from '@/lib/auth';

import { ErrorState } from './error-state';

type Props = {
  // useAuth's retryProfile: re-runs profile creation; on success the root
  // layout drops this screen and mounts the app.
  onRetry: () => Promise<void>;
};

// Shown by the root layout in place of the app when a new account's profile
// row couldn't be created at sign-in (bugs.md L3) — the person is signed in,
// but every screen past this one joins on that row. Two ways forward: try
// again, or sign out and start over. The body names the support address for
// the case where neither works.
export const ProfileSetupError = ({ onRetry }: Props) => {
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (err) {
      // Offline, sign-out can fail too; the screen stays and either button
      // can be tried again.
      console.warn('profile setup screen action failed', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ErrorState
      icon={Icons.errorGeneric}
      title={Strings.profileSetup.title}
      body={Strings.profileSetup.body(Strings.legal.supportEmail)}
      ctaLabel={Strings.profileSetup.retry}
      onRetry={() => void run(onRetry)}
      busy={busy}
      secondaryLabel={Strings.profileSetup.signOut}
      // No user id: push registration waits for the profile row, so this
      // account has no device token to remove.
      onSecondary={() => void run(() => signOut())}
    />
  );
};
