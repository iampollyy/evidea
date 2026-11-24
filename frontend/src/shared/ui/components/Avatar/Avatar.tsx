import type { ComponentPropsWithRef } from 'react';

import { Image } from '@/shared/ui/atoms/Image/Image';
import { getInitials } from '@/utils/getInitials';
import styles from './Avatar.module.scss';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarTone = 'subtle' | 'solid';

export interface AvatarProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  name: string;
  src?: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  decorative?: boolean;
}

export function Avatar({
  name,
  src,
  size = 'md',
  tone = 'subtle',
  decorative = false,
  className,
  ...rest
}: AvatarProps) {
  const classes = [styles.avatar, styles[size], styles[tone], className].filter(Boolean).join(' ');
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
