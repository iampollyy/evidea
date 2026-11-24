import { ROLE_LABELS } from '@/constants/doctor.constants';
import { HeaderNav } from '@/shared/ui/components/HeaderNav/HeaderNav';
import { Sidebar } from '@/shared/ui/components/Sidebar/Sidebar';
import type { WorkspaceLayoutProps } from '@/shared/types/workspaceLayout.types';
import styles from './WorkspaceLayout.module.scss';

export function WorkspaceLayout({
  user,
  navItems,
  activeNavId,
  homeHref,
  signOutError,
  onNavigate,
  onSignOut,
  children,
}: WorkspaceLayoutProps) {
  const roleLabel = ROLE_LABELS[user.role];
  const avatarUrl = user.avatarUrl ?? undefined;

  return (
    <div className={styles.shell}>
      <Sidebar
        className={styles.sidebar}
        logoHref={homeHref}
        doctor={{
          firstName: user.name,
          lastName: user.surname,
          position: roleLabel,
          avatarUrl,
        }}
        nav={{ items: navItems, activeId: activeNavId, onNavigate }}
        onSignOut={onSignOut}
      />

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <p className={styles.workspaceLabel}>{roleLabel} workspace</p>
          <HeaderNav user={{ name: `${user.name} ${user.surname}`, avatarSrc: avatarUrl }} />
        </header>

        {signOutError && (
          <p className={styles.signOutError} role="alert">
            {signOutError}
          </p>
        )}

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
