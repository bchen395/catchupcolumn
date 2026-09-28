import { useCallback, useEffect, useState } from 'react';

// Supabase allows one email per address per 60s by default. Mirror it in the UI
// so "Send a new code" is visibly unavailable rather than failing with a rate
// limit the user can't interpret. Shared by every screen that emails a code.
const RESEND_COOLDOWN_SECONDS = 60;

export const useResendCooldown = () => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const start = useCallback(() => setSecondsLeft(RESEND_COOLDOWN_SECONDS), []);

  return { secondsLeft, start };
};
