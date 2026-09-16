import { useCallback, useEffect, useRef, useState } from 'react';

import { mapAuthErrorMessage, sendEmailCode, verifyEmailCode } from '@/lib/auth';

// Supabase allows one code per address per 60s by default. Mirror it in the UI
// so "Send a new code" is visibly unavailable rather than failing with a rate
// limit the user can't interpret.
const RESEND_COOLDOWN_SECONDS = 60;

const CODE_LENGTH = 6;

export type EmailCodeStep = 'email' | 'code';

type UseEmailCodeOptions = {
  // Login passes false so an unknown address is an error we can explain;
  // signup passes true so one code both creates the account and signs in.
  allowNewUser: boolean;
  // Called after a session exists. Navigation lives with the screen because
  // login and signup land in different places.
  onVerified: () => void | Promise<void>;
};

/**
 * The email → 6-digit code flow, shared by the login and signup screens.
 *
 * Both screens are the same two steps with different copy and a different
 * destination, so the state machine lives here and they stay presentational.
 */
export const useEmailCode = ({ allowNewUser, onVerified }: UseEmailCodeOptions) => {
  const [step, setStep] = useState<EmailCodeStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secondsUntilResend, setSecondsUntilResend] = useState(0);

  // Guards a late verify response from touching state after unmount — the
  // screen navigates away on success, so this resolves into a dead component.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (secondsUntilResend <= 0) return;
    const timer = setInterval(() => {
      setSecondsUntilResend((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsUntilResend]);

  const requestCode = useCallback(
    async ({ isResend = false }: { isResend?: boolean } = {}) => {
      const emailError = validateEmail(email);
      setFieldError(emailError);
      setFormError('');

      if (emailError) return;

      try {
        setSending(true);
        await sendEmailCode(email, { allowNewUser });
        if (!mounted.current) return;
        setSecondsUntilResend(RESEND_COOLDOWN_SECONDS);
        if (!isResend) {
          setCode('');
          setStep('code');
        }
      } catch (error) {
        if (!mounted.current) return;
        setFormError(mapAuthErrorMessage(error, 'We could not send a code right now.'));
      } finally {
        if (mounted.current) setSending(false);
      }
    },
    [allowNewUser, email],
  );

  const submitCode = useCallback(async () => {
    const trimmed = code.trim();
    setFormError('');

    if (trimmed.length !== CODE_LENGTH) {
      setFieldError(`Enter the ${CODE_LENGTH}-digit code from your email.`);
      return;
    }
    setFieldError(undefined);

    try {
      setVerifying(true);
      await verifyEmailCode({ email, code: trimmed });
      await onVerified();
    } catch (error) {
      if (!mounted.current) return;
      setFormError(mapAuthErrorMessage(error, 'We could not sign you in right now.'));
    } finally {
      if (mounted.current) setVerifying(false);
    }
  }, [code, email, onVerified]);

  // Back to the email step: the address was probably mistyped, so keep it in
  // the field to be corrected rather than making them start over.
  const editEmail = useCallback(() => {
    setStep('email');
    setCode('');
    setFieldError(undefined);
    setFormError('');
  }, []);

  return {
    step,
    email,
    setEmail: (next: string) => {
      setEmail(next);
      if (fieldError) setFieldError(undefined);
    },
    code,
    setCode: (next: string) => {
      // The field is number-pad, but paste and some keyboards can still deliver
      // spaces or the surrounding text of an autofilled code.
      setCode(next.replace(/\D/g, '').slice(0, CODE_LENGTH));
      if (fieldError) setFieldError(undefined);
    },
    fieldError,
    formError,
    setFormError,
    sending,
    verifying,
    secondsUntilResend,
    canResend: secondsUntilResend === 0 && !sending,
    requestCode,
    submitCode,
    editEmail,
    codeLength: CODE_LENGTH,
  };
};

export const validateEmail = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Enter your email address.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(trimmedValue)) {
    return 'Enter a valid email address.';
  }

  return undefined;
};
