import { useCallback, useEffect, useRef, useState } from 'react';

import { useResendCooldown } from '@/hooks/use-resend-cooldown';
import { mapAuthErrorMessage, sendEmailCode, verifyEmailCode } from '@/lib/auth';

// Two halves of numbers that live in the Supabase dashboard (Authentication →
// the email provider): OTP Length, and OTP Expiry in seconds (600). The UI
// copy and the code email templates derive from these, so if either setting
// moves, these move with it. docs/LAUNCH.md step 5. The dashboard's expiry
// stays 3600 until the build carrying this copy is what people run (step 5
// item 5); until then "10 minutes" understates the real lifetime, harmlessly.
export const CODE_LENGTH = 6;
// 10 minutes is NIST 800-63B-4 §3.1.3.2 and OWASP ASVS 5.0 6.5.5. It is also
// the one brute-force defence we control: GoTrue limits wrong guesses per IP,
// not per account. Decided 2026-09-25; resending is one tap after 60s.
export const CODE_EXPIRY_MINUTES = 10;

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
  const { secondsLeft: secondsUntilResend, start: startCooldown } = useResendCooldown();

  // Guards a late verify response from touching state after unmount — the
  // screen navigates away on success, so this resolves into a dead component.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // `email` overrides the field for a caller that already has the address in
  // hand — the password form's "Forgot your password?" — so it doesn't have to
  // wait a render for setEmail to land before sending.
  const requestCode = useCallback(
    async ({ isResend = false, email: override }: { isResend?: boolean; email?: string } = {}) => {
      const target = override ?? email;
      if (override !== undefined) setEmail(override);

      const emailError = validateEmail(target);
      setFieldError(emailError);
      setFormError('');

      if (emailError) return;

      try {
        setSending(true);
        await sendEmailCode(target, { allowNewUser });
        if (!mounted.current) return;
        startCooldown();
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
    [allowNewUser, email, startCooldown],
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
    // CodeField has already stripped this to digits.
    setCode: (next: string) => {
      setCode(next);
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
    codeExpiryMinutes: CODE_EXPIRY_MINUTES,
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
