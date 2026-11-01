import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

import { Strings } from '@/constants/strings';
import { fetchMyDelivery, setDeliveryPreferences } from '@/lib/groups';
import {
  getPushPermissionStatus,
  registerForPushAsync,
  type PushPermissionStatus,
} from '@/lib/notifications';
import type { DeliveryPreferences } from '@/types';

export type DeliveryChange = { email?: boolean; push?: boolean };

/**
 * The signed-in member's "Your delivery" switches for one Group: what's
 * saved, a save that shows the change at once and takes it back if the
 * server refuses it, and whether this phone blocks the app's notifications.
 *
 * Both are read again whenever the app comes back to the front: an edition
 * email's unsubscribe link turns email off from outside the app, and the
 * "Open Settings" link sends people to the phone's Settings and back.
 */
export const useDeliverySettings = (groupId: string | undefined, userId: string) => {
  // Null until loaded, or if this person isn't in the Group.
  const [delivery, setDelivery] = useState<DeliveryPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState<PushPermissionStatus>('unavailable');
  // Read by callbacks that outlive a render: a reload must not overwrite a
  // save in flight, and a second tap mustn't start another.
  const savingRef = useRef(false);

  // Never throws: the section is secondary, so a failed read keeps what's
  // shown (or leaves the section out) and pull to refresh tries again.
  const reload = useCallback(async () => {
    if (!groupId || !userId || savingRef.current) return;
    try {
      const next = await fetchMyDelivery(groupId, userId);
      if (!savingRef.current) setDelivery(next);
    } catch (_err) {
      // Keep what's shown.
    }
  }, [groupId, userId]);

  // The first read, once the Group and the signed-in user are both known.
  useEffect(() => {
    if (!groupId || !userId) return;
    let active = true;
    fetchMyDelivery(groupId, userId)
      .then((next) => {
        if (active) setDelivery(next);
      })
      .catch(() => {
        // The section stays out; pull to refresh tries again.
      });
    return () => {
      active = false;
    };
  }, [groupId, userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const checkPermission = async () => {
      const status = await getPushPermissionStatus();
      if (!active) return;
      setPermission(status);
      // Turned on in Settings after saying no at sign-in: register this phone
      // now rather than at the next cold start. A no-op once registered.
      if (status === 'granted') void registerForPushAsync(userId);
    };
    void checkPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void checkPermission();
      void reload();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [userId, reload]);

  // One change at a time; a tap while one is saving is ignored.
  const save = useCallback(
    async (change: DeliveryChange) => {
      const before = delivery;
      if (!groupId || !before || savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      setError('');
      setDelivery({
        email_subscribed: change.email ?? before.email_subscribed,
        push_subscribed: change.push ?? before.push_subscribed,
      });
      try {
        setDelivery(await setDeliveryPreferences(groupId, change));
      } catch (_err) {
        setDelivery(before);
        setError(Strings.delivery.saveFailed);
        AccessibilityInfo.announceForAccessibility(Strings.delivery.saveFailed);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [groupId, delivery],
  );

  return {
    delivery,
    save,
    saving,
    error,
    // Only worth saying while the switch asks for notifications.
    pushBlocked: permission === 'denied' && delivery?.push_subscribed === true,
    reload,
  };
};
