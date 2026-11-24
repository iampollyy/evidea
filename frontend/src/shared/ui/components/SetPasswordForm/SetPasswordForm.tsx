import type { ComponentPropsWithRef, ReactNode } from 'react';

import {
  EMPTY_SET_PASSWORD,
  PASSWORD_HINT,
  SET_PASSWORD_FIELD_ORDER,
} from '@/constants/forms.constants';
import { useValidatedForm } from '@/hooks/useValidatedForm';
import type { SetPasswordFormValues } from '@/types/forms.types';
import { Button } from '@/ui/atoms/Button/Button';
import { Icon } from '@/ui/atoms/Icon/Icon';
import { PasswordInput } from '@/ui/components/PasswordInput/PasswordInput';
import { validateSetPassword } from '@/utils/validation/setPassword';
import styles from './SetPasswordForm.module.scss';

export interface SetPasswordFormProps extends Omit<
  ComponentPropsWithRef<'form'>,
  'onSubmit' | 'children' | 'title'
> {
  onSubmit: (values: SetPasswordFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  submitError?: ReactNode;
}

export function SetPasswordForm({
  onSubmit,
  isSubmitting = false,
  submitError,
  id,
  className,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: SetPasswordFormProps) {
  const form = useValidatedForm({
    initialValues: EMPTY_SET_PASSWORD,
    validate: validateSetPassword,
    fieldOrder: SET_PASSWORD_FIELD_ORDER,
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
          Set Password
        </h1>
        <p className={styles.subtitle}>Create a password to activate your account</p>
      </header>

      <div className={styles.fields}>
        <PasswordInput
          label="New Password"
          placeholder="************"
          autoComplete="new-password"
          leadingIcon={<Icon name="lock" />}
          hint={PASSWORD_HINT}
          {...form.bindInput('password')}
        />
        <PasswordInput
          label="Confirm Password"
          placeholder="************"
          autoComplete="new-password"
          leadingIcon={<Icon name="lock" />}
          {...form.bindInput('confirmPassword')}
        />

        {hasSubmitError && (
          <p className={styles.alert} role="alert">
            <Icon name="error" className={styles.alertIcon} />
            {submitError}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Set Password'}
        </Button>
      </div>
    </form>
  );
}
