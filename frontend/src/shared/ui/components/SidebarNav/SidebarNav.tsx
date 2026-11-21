import type { ComponentPropsWithRef, MouseEvent } from 'react';

import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import styles from './SidebarNav.module.scss';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  count?: number;
}

export interface SidebarNavProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  items: SidebarNavItem[];
  activeId?: string;
  onNavigate?: (item: SidebarNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
}

export function SidebarNav({
  items,
  activeId,
  onNavigate,
  className,
  'aria-label': ariaLabel = 'Primary navigation',
  ...rest
}: SidebarNavProps) {
  const classes = [styles.nav, className].filter(Boolean).join(' ');

  return (
    <nav className={classes} aria-label={ariaLabel} {...rest}>
      <ul className={styles.list}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          const linkClasses = [styles.link, isActive && styles.active].filter(Boolean).join(' ');

          return (
            <li key={item.id}>
              <a
                href={item.href}
                className={linkClasses}
                aria-current={isActive ? 'page' : undefined}
                onClick={onNavigate && ((event) => onNavigate(item, event))}
              >
                <Icon name={item.icon} className={styles.icon} />
                <span className={styles.label}>{item.label}</span>
                {item.count != null && <span className={styles.count}>{item.count}</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
