import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';

import styles from './Input.module.scss';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  label: ReactNode;
  size?: InputSize;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
}

export function Input({
  label,
  size = 'md',
  hideLabel = false,
  hint,
  error,
  leadingIcon,
  trailing,
  id,
  required,
  disabled,
  type = 'text',
  className,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const hasError = error != null && error !== false && error !== '';

  const describedBy =
    [ariaDescribedBy, hint != null && hintId, hasError && errorId].filter(Boolean).join(' ') ||
    undefined;

  const classes = [
    styles.field,
    styles[size],
    hasError && styles.invalid,
    disabled && styles.disabled,
    leadingIcon != null && styles.hasLeading,
    trailing != null && styles.hasTrailing,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <label htmlFor={inputId} className={hideLabel ? styles.visuallyHidden : styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className={styles.control}>
        {leadingIcon != null && (
          <span className={styles.leading} aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={styles.input}
          {...rest}
        />
        {trailing != null && <span className={styles.trailing}>{trailing}</span>}
      </div>
      {hint != null && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
