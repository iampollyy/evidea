import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
  type Location,
} from 'react-router-dom';

import type { CurrentUser } from '@/shared/api/auth.types';
import { LoginPage } from '@/shared/ui/pages/LoginPage/LoginPage';
import { SetPasswordPage } from '@/shared/ui/pages/SetPasswordPage/SetPasswordPage';
import { useCurrentUser } from './CurrentUserContext';
import { HOME_PATH_BY_ROLE, ROUTES } from './paths';

type LoginLocationState = { from?: Pick<Location, 'pathname' | 'search' | 'hash'> } | null;

export function LoginRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as LoginLocationState)?.from;

  const handleLoginSuccess = (user: CurrentUser) => {
    const target = from
      ? `${from.pathname}${from.search}${from.hash}`
      : HOME_PATH_BY_ROLE[user.role];
    navigate(target, { replace: true });
  };

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

export function AcceptInvitationRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim() || null;

  return (
    <SetPasswordPage token={token} onGoToLogin={() => navigate(ROUTES.login, { replace: true })} />
  );
}

export function HomeRoute() {
  const user = useCurrentUser();
  const homePath = HOME_PATH_BY_ROLE[user.role];

  if (homePath !== ROUTES.home) {
    return <Navigate to={homePath} replace />;
  }

  return (
    <main>
      <h1>EVIDEA</h1>
      <p>You are signed in.</p>
    </main>
  );
}

export function ForbiddenPage() {
  return (
    <main>
      <h1>Access denied</h1>
      <p>You do not have permission to view this page.</p>
    </main>
  );
}
