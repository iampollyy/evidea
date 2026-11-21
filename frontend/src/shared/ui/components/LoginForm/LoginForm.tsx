import type { ComponentPropsWithRef, ReactNode } from 'react';

import { useValidatedForm } from '@/shared/lib/form/useValidatedForm';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { Input } from '@/shared/ui/atoms/Input/Input';
import { PasswordInput } from '@/shared/ui/components/PasswordInput/PasswordInput';
import styles from './LoginForm.module.scss';
import {
  EMPTY_LOGIN,
  LOGIN_FIELD_ORDER,
  validateLogin,
  type LoginFormValues,
} from './validateLogin';

export type { LoginFormValues } from './validateLogin';

export interface LoginFormProps extends Omit<
  ComponentPropsWithRef<'form'>,
  'onSubmit' | 'children' | 'title'
> {
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  defaultValues?: Partial<LoginFormValues>;
  isSubmitting?: boolean;
  submitError?: ReactNode;
  forgotPasswordHref?: string;
}

export function LoginForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  submitError,
  forgotPasswordHref = '#',
  id,
  className,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: LoginFormProps) {
  const form = useValidatedForm({
    initialValues: { ...EMPTY_LOGIN, ...defaultValues },
    validate: validateLogin,
    fieldOrder: LOGIN_FIELD_ORDER,
    id,
    disabled: isSubmitting,
  });

  const titleId = `${form.formId}-title`;
  const hasSubmitError = submitError != null && submitError !== false && submitError !== '';
  const classes = [styles.form, className].filter(Boolean).join(' ');

  return (
    <form
      id={form.formId}
      noValidate
      aria-labelledby={ariaLabelledBy ?? titleId}
      aria-busy={isSubmitting || undefined}
      className={classes}
      onSubmit={form.handleSubmit(onSubmit)}
      {...rest}
    >
      <header className={styles.header}>
        <h1 id={titleId} className={styles.title}>
          Sign In
        </h1>
        <p className={styles.subtitle}>Please enter below details to access the dashboard</p>
      </header>

      <div className={styles.fields}>
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter Email Address"
          autoComplete="email"
          leadingIcon={<Icon name="person" />}
          {...form.bindInput('email')}
        />
        <PasswordInput
          label="Password"
          placeholder="************"
          autoComplete="current-password"
          leadingIcon={<Icon name="lock" />}
          {...form.bindInput('password')}
        />

        <a href={forgotPasswordHref} className={styles.forgot}>
          Forgot password?
        </a>

        {hasSubmitError && (
          <p className={styles.alert} role="alert">
            <Icon name="error" className={styles.alertIcon} />
            {submitError}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Login'}
        </Button>
      </div>
    </form>
  );
}
