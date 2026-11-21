import type { ComponentPropsWithRef, ReactNode } from 'react';

import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
}

type ButtonContentProps =
  { children: ReactNode } | { children?: never; icon: ReactNode; 'aria-label': string };

export type ButtonProps = ButtonBaseProps & ButtonContentProps;

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    children == null && styles.iconOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {icon != null && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
