import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';

import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import styles from './FormPanel.module.scss';

export interface FormPanelProps extends Omit<ComponentPropsWithRef<'form'>, 'title'> {
  title: ReactNode;
  submitLabel: ReactNode;
  submittingLabel?: ReactNode;
  onCancel?: () => void;
  isSubmitting?: boolean;
  invalidFieldCount?: number;
  submitError?: ReactNode;
}

export function FormPanel({
  title,
  submitLabel,
  submittingLabel = 'Saving…',
  onCancel,
  isSubmitting = false,
  invalidFieldCount = 0,
  submitError,
  id,
  className,
  children,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: FormPanelProps) {
  const generatedId = useId();
  const formId = id ?? generatedId;
  const titleId = `${formId}-title`;
  const hasSubmitError = submitError != null && submitError !== false && submitError !== '';
  const classes = [styles.form, className].filter(Boolean).join(' ');

  return (
    <form
      id={formId}
      noValidate
      aria-labelledby={ariaLabelledBy ?? titleId}
      aria-busy={isSubmitting || undefined}
      className={classes}
      {...rest}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="close" />}
            aria-label="Close"
            onClick={onCancel}
          />
        )}
      </header>

      {invalidFieldCount > 0 && (
        <p className={styles.alert} role="alert">
          <Icon name="error" className={styles.alertIcon} />
          {invalidFieldCount === 1
            ? 'Please fix 1 field to continue.'
            : `Please fix ${invalidFieldCount} fields to continue.`}
        </p>
      )}

      {children}

      {hasSubmitError && (
        <p className={styles.alert} role="alert">
          <Icon name="error" className={styles.alertIcon} />
          {submitError}
        </p>
      )}

      <footer className={styles.footer}>
        {onCancel && (
          <Button variant="tertiary" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </footer>
    </form>
  );
}
