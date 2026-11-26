import styles from './Spinner.module.scss';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export function Spinner({ size = 'lg', label = 'Loading', className, ...rest }: SpinnerProps) {
  const classes = [styles.spinner, styles[size], className].filter(Boolean).join(' ');

  return (
    <span className={classes} role="img" aria-label={label} {...rest}>
      <span className={styles.arc} aria-hidden="true" />
      <span className={styles.core} aria-hidden="true" />
    </span>
  );
}
