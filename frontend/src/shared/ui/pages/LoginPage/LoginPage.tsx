import { useEffect, useRef, useState } from 'react';

import { AuthError, login } from '@/shared/api/auth';
import { Logo } from '@/shared/ui/atoms/Logo/Logo';
import { LoginForm, type LoginFormValues } from '@/shared/ui/components/LoginForm/LoginForm';
import styles from './LoginPage.module.scss';

export interface LoginPageProps {
  onLoginSuccess?: () => void;
}

function getErrorMessage(error: unknown) {
  if (error instanceof AuthError && (error.status === 400 || error.status === 401)) {
    return 'Invalid email or password';
  }
  if (error instanceof AuthError && error.status === 403) {
    return 'Your account has been deactivated. Please contact an administrator.';
  }
  return 'Something went wrong. Please try again.';
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
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
      await login(values, controller.signal);
      onLoginSuccess?.();
    } catch (error) {
      if (controller.signal.aborted) return;
      setSubmitError(getErrorMessage(error));
    } finally {
      if (!controller.signal.aborted) setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <Logo tone="inverse" size="lg" tagline={null} />
        <LoginForm
          className={styles.form}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>
    </section>
  );
}
