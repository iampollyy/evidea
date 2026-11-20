import type { ComponentPropsWithRef } from 'react';

import { Image } from '@/shared/ui/atoms/Image/Image';
import styles from './Avatar.module.scss';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  name: string;
  src?: string;
  size?: AvatarSize;
  decorative?: boolean;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function Avatar({
  name,
  src,
  size = 'md',
  decorative = false,
  className,
  ...rest
}: AvatarProps) {
  const classes = [styles.avatar, styles[size], className].filter(Boolean).join(' ');
  const label = decorative ? undefined : name;

  const initials = (
    <span
      className={styles.initials}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={decorative || undefined}
    >
      <span aria-hidden="true">{getInitials(name)}</span>
    </span>
  );

  return (
    <span className={classes} {...rest}>
      {src ? (
        <Image
          src={src}
          alt={label ?? ''}
          aspectRatio="1/1"
          fit="cover"
          className={styles.image}
          fallback={initials}
        />
      ) : (
        initials
      )}
    </span>
  );
}
