import { useLogin } from '@/shared/hooks/useLogin';
import type { LoginPageProps } from '@/shared/types/pages.types';
import { Logo } from '@/shared/ui/atoms/Logo/Logo';
import { LoginForm } from '@/shared/ui/components/LoginForm/LoginForm';
import styles from './LoginPage.module.scss';

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { isSubmitting, submitError, handleSubmit } = useLogin(onLoginSuccess);

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
