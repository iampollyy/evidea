import type { ComponentPropsWithRef } from 'react';

import { Icon } from '@/ui/atoms/Icon/Icon';
import { Avatar } from '@/ui/components/Avatar/Avatar';
import styles from './HeaderNav.module.scss';

export interface HeaderNavUser {
  name: string;
  avatarSrc?: string;
}

export interface HeaderNavProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  user: HeaderNavUser;
  hasUnreadNotifications?: boolean;
  onCalendarClick?: () => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
}

export function HeaderNav({
  user,
  hasUnreadNotifications = false,
  onCalendarClick,
  onSettingsClick,
  onNotificationsClick,
  onProfileClick,
  className,
  'aria-label': ariaLabel = 'User navigation',
  ...rest
}: HeaderNavProps) {
  const classes = [styles.nav, className].filter(Boolean).join(' ');
  const notificationsLabel = hasUnreadNotifications
    ? 'Notifications, you have unread notifications'
    : 'Notifications';

  return (
    <nav className={classes} aria-label={ariaLabel} {...rest}>
      <ul className={styles.actions}>
        <li>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onCalendarClick}
            aria-label="Calendar"
          >
            <Icon name="calendar_today" className={styles.icon} />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onSettingsClick}
            aria-label="Settings"
          >
            <Icon name="settings" className={styles.icon} />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onNotificationsClick}
            aria-label={notificationsLabel}
          >
            <Icon name="notifications" className={styles.icon} />
            {hasUnreadNotifications && <span className={styles.dot} aria-hidden="true" />}
          </button>
        </li>
      </ul>
      <button
        type="button"
        className={styles.profileButton}
        onClick={onProfileClick}
        aria-label={`Open profile menu for ${user.name}`}
      >
        <Avatar name={user.name} src={user.avatarSrc} size="sm" decorative />
      </button>
    </nav>
  );
}
