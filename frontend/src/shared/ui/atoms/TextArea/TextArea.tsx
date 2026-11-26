import { useId, type ChangeEvent, type ReactNode } from 'react';

import styles from './TextArea.module.scss';

export type TextAreaVariant = 'field' | 'notes';

export interface TextAreaProps {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  variant?: TextAreaVariant;
  hideLabel?: boolean;
  hint?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TextArea({
  label,
  value,
  onChange,
  variant = 'field',
  hideLabel = false,
  hint,
  placeholder,
  disabled,
  className,
}: TextAreaProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const classes = [styles.field, styles[variant], className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <label htmlFor={id} className={hideLabel ? styles.visuallyHidden : styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={hint != null ? hintId : undefined}
          className={styles.textarea}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        />
      </div>
      {hint != null && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
