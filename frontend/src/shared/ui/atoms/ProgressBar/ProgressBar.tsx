import type { ComponentPropsWithRef } from 'react';

import styles from './ProgressBar.module.scss';

export interface ProgressBarProps extends ComponentPropsWithRef<'div'> {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label = 'Progress', className, ...rest }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value));
  const classes = [styles.track, className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      {...rest}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}
