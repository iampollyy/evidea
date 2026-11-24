import { INVALID_INVITATION_MESSAGE } from '@/constants/auth.constants';
import { useSetPassword } from '@/hooks/useSetPassword';
import type { SetPasswordPageProps } from '@/types/pages.types';
import { Button } from '@/ui/atoms/Button/Button';
import { Icon } from '@/ui/atoms/Icon/Icon';
import { Logo } from '@/ui/atoms/Logo/Logo';
import { SetPasswordForm } from '@/ui/components/SetPasswordForm/SetPasswordForm';
import styles from './SetPasswordPage.module.scss';

export function SetPasswordPage({ token, onGoToLogin }: SetPasswordPageProps) {
  const { isSubmitting, submitError, isComplete, handleSubmit } = useSetPassword(token);

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
          <p className={styles.text}>{INVALID_INVITATION_MESSAGE}</p>
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
