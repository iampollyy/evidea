import { useEffect, useRef, useState } from 'react';

import { acceptInvitation, AuthError } from '@/shared/api/auth';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { Logo } from '@/shared/ui/atoms/Logo/Logo';
import {
  SetPasswordForm,
  type SetPasswordFormValues,
} from '@/shared/ui/components/SetPasswordForm/SetPasswordForm';
import styles from './SetPasswordPage.module.scss';

const INVALID_LINK_MESSAGE =
  'This invitation link is invalid or has expired. Please ask your administrator to send a new invitation.';

export interface SetPasswordPageProps {
  token: string | null;
  onGoToLogin: () => void;
}

function getErrorMessage(error: unknown) {
  if (error instanceof AuthError && error.code === 'INVITATION_INVALID') {
    return INVALID_LINK_MESSAGE;
  }
  if (error instanceof AuthError && error.status === 422) {
    return 'Password does not meet the requirements.';
  }
  return 'Something went wrong. Please try again.';
}

export function SetPasswordPage({ token, onGoToLogin }: SetPasswordPageProps) {
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
      setSubmitError(getErrorMessage(error));
    } finally {
      if (!controller.signal.aborted) setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isComplete) {
      return (
        <div className={styles.card} role="status">
          <Icon name="check_circle" className={`${styles.icon} ${styles.success}`} />
          <h1 className={styles.title}>Password Set</h1>
          <p className={styles.text}>
            Your password has been set successfully. You can now sign in to your account.
          </p>
          <Button size="lg" fullWidth onClick={onGoToLogin}>
            Go to Login
          </Button>
        </div>
      );
    }

    if (!token) {
      return (
        <div className={styles.card} role="alert">
          <Icon name="link_off" className={`${styles.icon} ${styles.error}`} />
          <h1 className={styles.title}>Invalid Link</h1>
          <p className={styles.text}>{INVALID_LINK_MESSAGE}</p>
          <Button variant="secondary" size="lg" fullWidth onClick={onGoToLogin}>
            Go to Login
          </Button>
        </div>
      );
    }

    return (
      <SetPasswordForm
        className={styles.form}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    );
  };

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <Logo tone="inverse" size="lg" tagline={null} />
        {renderContent()}
      </div>
    </section>
  );
}
