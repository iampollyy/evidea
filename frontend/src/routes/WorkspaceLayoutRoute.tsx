import { useState } from 'react';
import { matchPath, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { logout } from '@/shared/api/auth';
import type { SidebarNavItem } from '@/shared/ui/components/SidebarNav/SidebarNav';
import { WorkspaceLayout } from '@/shared/ui/organisms/WorkspaceLayout/WorkspaceLayout';
import { useCurrentUser } from './CurrentUserContext';
import { ROUTES } from './paths';

interface WorkspaceLayoutRouteProps {
  navItems: SidebarNavItem[];
  homeHref: string;
}

export function WorkspaceLayoutRoute({ navItems, homeHref }: WorkspaceLayoutRouteProps) {
  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const activeNavId = navItems.find((item) =>
    matchPath({ path: item.href, end: false }, location.pathname),
  )?.id;

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await logout();
      navigate(ROUTES.login, { replace: true });
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out');
    }
  };

  return (
    <WorkspaceLayout
      user={user}
      navItems={navItems}
      activeNavId={activeNavId}
      homeHref={homeHref}
      signOutError={signOutError}
      onNavigate={(item, event) => {
        event.preventDefault();
        navigate(item.href);
      }}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </WorkspaceLayout>
  );
}
