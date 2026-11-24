import type { ComponentPropsWithRef } from 'react';

import { Button } from '@/ui/atoms/Button/Button';
import { Icon } from '@/ui/atoms/Icon/Icon';
import { Logo } from '@/ui/atoms/Logo/Logo';
import { Avatar } from '@/ui/components/Avatar/Avatar';
import { SidebarNav, type SidebarNavProps } from '@/ui/components/SidebarNav/SidebarNav';
import styles from './Sidebar.module.scss';

export interface SidebarDoctor {
  firstName: string;
  lastName: string;
  position: string;
  avatarUrl?: string;
}

export interface SidebarProps extends Omit<ComponentPropsWithRef<'aside'>, 'children'> {
  nav: SidebarNavProps;
  doctor: SidebarDoctor;
  onSignOut: () => void;
  logoHref?: string;
}

export function Sidebar({ nav, doctor, onSignOut, logoHref, className, ...rest }: SidebarProps) {
  const classes = [styles.sidebar, className].filter(Boolean).join(' ');
  const fullName = `${doctor.firstName} ${doctor.lastName}`;

  return (
    <aside className={classes} {...rest}>
      <div className={styles.brand}>
        <Logo href={logoHref} />
      </div>

      <SidebarNav {...nav} className={[styles.nav, nav.className].filter(Boolean).join(' ')} />

      <div className={styles.footer}>
        <div className={styles.profile}>
          <Avatar
            name={fullName}
            src={doctor.avatarUrl}
            tone="solid"
            decorative
            className={styles.avatar}
          />
          <div className={styles.profileText}>
            <p className={styles.name}>Dr. {fullName}</p>
            <p className={styles.position}>{doctor.position}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          fullWidth
          icon={<Icon name="logout" />}
          className={styles.signOut}
          onClick={onSignOut}
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}
