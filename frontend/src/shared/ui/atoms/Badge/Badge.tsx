import type { ComponentPropsWithRef, ReactNode } from 'react';

import styles from './Badge.module.scss';

export type BadgeVariant = 'brand' | 'neutral' | 'success' | 'info' | 'warning' | 'error';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  inverse?: boolean;
  icon?: ReactNode;
}

export function Badge({
  variant = 'brand',
  size = 'md',
  inverse = false,
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    inverse && styles.inverse,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {icon != null && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
