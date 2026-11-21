import type { ComponentPropsWithRef } from 'react';

import logoMark from '@/assets/brand/logo-mark.svg';
import { Image } from '@/shared/ui/atoms/Image/Image';
import styles from './Logo.module.scss';

export type LogoTone = 'default' | 'inverse';
export type LogoSize = 'md' | 'lg';

export interface LogoProps extends Omit<ComponentPropsWithRef<'a'>, 'children'> {
  tagline?: string | null;
  tone?: LogoTone;
  size?: LogoSize;
}

export function Logo({
  tagline = 'Decision Support',
  tone = 'default',
  size = 'md',
  href,
  className,
  'aria-label': ariaLabel = 'EVIDEA home',
  ...rest
}: LogoProps) {
  const classes = [styles.logo, styles[tone], styles[size], className].filter(Boolean).join(' ');

  const content = (
    <>
      <Image
        src={logoMark}
        alt=""
        width={28}
        height={28}
        fit="contain"
        loading="eager"
        className={styles.mark}
      />
      <span className={styles.text}>
        <span className={styles.wordmark}>EVIDEA</span>
        {tagline && <span className={styles.tagline}>{tagline}</span>}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel} {...rest}>
        {content}
      </a>
    );
  }

  return <span className={classes}>{content}</span>;
}
