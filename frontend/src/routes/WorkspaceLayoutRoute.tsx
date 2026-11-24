import { matchPath, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSignOut } from '@/hooks/useSignOut';
import type { WorkspaceLayoutRouteProps } from '@/types/routes.types';
import { WorkspaceLayout } from '@/ui/organisms/WorkspaceLayout/WorkspaceLayout';

export function WorkspaceLayoutRoute({ navItems, homeHref }: WorkspaceLayoutRouteProps) {
  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOutError, signOut } = useSignOut();

  const activeNavId = navItems.find((item) =>
    matchPath({ path: item.href, end: false }, location.pathname),
  )?.id;

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
      onSignOut={signOut}
    >
      <Outlet />
    </WorkspaceLayout>
  );
}
