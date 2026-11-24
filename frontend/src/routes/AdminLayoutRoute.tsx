import { useState } from 'react';
import { matchPath, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { logout } from '@/shared/api/auth';
import { AdminLayout } from '@/shared/ui/organisms/AdminLayout/AdminLayout';
import { ADMIN_NAV_ITEMS } from './adminNav';
import { useCurrentUser } from './CurrentUserContext';
import { ROUTES } from './paths';

export function AdminLayoutRoute() {
  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const activeNavId = ADMIN_NAV_ITEMS.find((item) =>
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
    <AdminLayout
      user={user}
      navItems={ADMIN_NAV_ITEMS}
      activeNavId={activeNavId}
      homeHref={ROUTES.admin.root}
      signOutError={signOutError}
      onNavigate={(item, event) => {
        event.preventDefault();
        navigate(item.href);
      }}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </AdminLayout>
  );
}
