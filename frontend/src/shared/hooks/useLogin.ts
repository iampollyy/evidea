import { useEffect, useRef, useState } from 'react';

import { login } from '@/api/auth';
import type { CurrentUser } from '@/shared/types/auth.types';
import type { LoginFormValues } from '@/shared/types/forms.types';
import { getLoginErrorMessage } from '@/utils/authErrors';

export function useLogin(onLoginSuccess?: (user: CurrentUser) => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSubmit = async (values: LoginFormValues) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const user = await login(values, controller.signal);
      onLoginSuccess?.(user);
    } catch (error) {
      if (controller.signal.aborted) return;
      setSubmitError(getLoginErrorMessage(error));
    } finally {
      if (!controller.signal.aborted) setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitError, handleSubmit };
}
