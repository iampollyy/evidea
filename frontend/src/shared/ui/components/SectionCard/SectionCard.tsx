import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';

import { Icon } from '@/ui/atoms/Icon/Icon';
import styles from './SectionCard.module.scss';

export interface SectionCardProps extends Omit<ComponentPropsWithRef<'section'>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  actions?: ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  icon,
  actions,
  className,
  children,
  ...rest
}: SectionCardProps) {
  const titleId = useId();
  const classes = [styles.card, className].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-labelledby={titleId} {...rest}>
      <header className={styles.header}>
        <div className={styles.heading}>
          {icon && <Icon name={icon} className={styles.icon} />}
          <div className={styles.titles}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
