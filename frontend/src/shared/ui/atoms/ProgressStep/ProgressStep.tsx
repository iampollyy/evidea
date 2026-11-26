import type { ReactNode } from 'react';

import type { ProgressStepStatus } from '@/shared/types/predictions.types';
import { Icon } from '../Icon/Icon';
import styles from './ProgressStep.module.scss';

export interface ProgressStepProps {
  status: ProgressStepStatus;
  className?: string;
  children?: ReactNode;
}

export function ProgressStep({ status, className, children, ...rest }: ProgressStepProps) {
  const classes = [styles.step, styles[status], className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...rest}>
      {status === 'done' ? (
        <Icon name="check" className={styles.check} />
      ) : (
        <span className={styles.dot} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
