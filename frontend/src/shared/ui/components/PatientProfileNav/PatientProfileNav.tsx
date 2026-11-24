import type { ComponentPropsWithRef, MouseEvent } from 'react';

import { isPlainLeftClick } from '@/utils/isPlainLeftClick';
import styles from './PatientProfileNav.module.scss';

export interface PatientProfileNavItem {
  id: string;
  label: string;
  href: string;
}

export interface PatientProfileNavProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  items: PatientProfileNavItem[];
  activeId?: string;
  onNavigate?: (item: PatientProfileNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
}

export function PatientProfileNav({
  items,
  activeId,
  onNavigate,
  className,
  'aria-label': ariaLabel = 'Patient profile sections',
  ...rest
}: PatientProfileNavProps) {
  const classes = [styles.nav, className].filter(Boolean).join(' ');

  return (
    <nav className={classes} aria-label={ariaLabel} {...rest}>
      <ul className={styles.list}>
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <li key={item.id}>
              <a
                href={item.href}
                className={[styles.link, isActive && styles.active].filter(Boolean).join(' ')}
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => {
                  if (onNavigate && isPlainLeftClick(event)) onNavigate(item, event);
                }}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
