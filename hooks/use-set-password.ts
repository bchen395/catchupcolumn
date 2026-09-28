import { useCallback, useEffect, useRef, useState } from 'react';

import { CODE_LENGTH } from '@/hooks/use-email-code';
import { useResendCooldown } from '@/hooks/use-resend-cooldown';
import {
  isReauthenticationNeeded,
  mapAuthErrorMessage,
  sendReauthenticationCode,
  setPassword,
  validateNewPassword,
} from '@/lib/auth';

// 'password' — choose one. 'code' — only when the server asks for proof it's
// them (a session over a day old; see setPassword in lib/auth.ts).
export type SetPasswordStep = 'password' | 'code';

/**
 * Set or replace a password, asking for an emailed code only when GoTrue says
 * the session is too old to change it without one. Letting the server decide
 * keeps this in step with the dashboard's "Secure password change" setting:
 * a client that always asked would be asking for a code GoTrue then ignores.
 */
export const useSetPassword = ({ onSaved }: { onSaved: () => void }) => {
  const [step, setStep] = useState<SetPasswordStep>('password');
  const [password, setPasswordValue] = useState('');
  const [code, setCodeValue] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const { secondsLeft, start: startCooldown } = useResendCooldown();

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const sendCode = useCallback(async () => {
    setFormError('');
    try {
      setSending(true);
      await sendReauthenticationCode();
      if (!mounted.current) return;
      startCooldown();
      setCodeValue('');
      setFieldError(undefined);
      setStep('code');
    } catch (error) {
      if (!mounted.current) return;
      setFormError(mapAuthErrorMessage(error, 'We could not send a code right now.'));
    } finally {
      if (mounted.current) setSending(false);
    }
  }, [startCooldown]);

  const save = useCallback(async () => {
    setFormError('');

    const passwordError = validateNewPassword(password);
    if (passwordError) {
      setStep('password');
      setFieldError(passwordError);
      return;
    }
    if (step === 'code' && code.length !== CODE_LENGTH) {
      setFieldError(`Enter the ${CODE_LENGTH}-digit code from your email.`);
      return;
    }
    setFieldError(undefined);

    try {
      setSaving(true);
      await setPassword({ password, nonce: step === 'code' ? code : undefined });
      onSaved();
    } catch (error) {
      if (!mounted.current) return;
      if (step === 'password' && isReauthenticationNeeded(error)) {
        await sendCode();
        return;
      }
      setFormError(mapAuthErrorMessage(error, 'We could not save your password right now.'));
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, [code, onSaved, password, sendCode, step]);

  // From the code step back to the password, kept as typed.
  const editPassword = useCallback(() => {
    setStep('password');
    setFieldError(undefined);
    setFormError('');
  }, []);

  return {
    step,
    password,
    setPassword: (next: string) => {
      setPasswordValue(next);
      if (fieldError) setFieldError(undefined);
    },
    code,
    setCode: (next: string) => {
      setCodeValue(next);
      if (fieldError) setFieldError(undefined);
    },
    fieldError,
    formError,
    saving,
    sending,
    secondsUntilResend: secondsLeft,
    canResend: secondsLeft === 0 && !sending,
    save,
    resendCode: sendCode,
    editPassword,
  };
};
