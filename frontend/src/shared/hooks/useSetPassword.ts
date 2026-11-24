import { useEffect, useRef, useState } from 'react';

import { acceptInvitation } from '@/api/auth';
import type { SetPasswordFormValues } from '@/shared/types/forms.types';
import { getSetPasswordErrorMessage } from '@/utils/authErrors';

export function useSetPassword(token: string | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSubmit = async ({ password }: SetPasswordFormValues) => {
    if (!token) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await acceptInvitation({ token, password }, controller.signal);
      setIsComplete(true);
    } catch (error) {
      if (controller.signal.aborted) return;
      setSubmitError(getSetPasswordErrorMessage(error));
    } finally {
      if (!controller.signal.aborted) setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitError, isComplete, handleSubmit };
}
