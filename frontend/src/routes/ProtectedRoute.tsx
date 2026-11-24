import { Navigate, useLocation } from 'react-router-dom';

import type { ProtectedRouteProps } from '@/shared/types/routes.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkSession, selectSessionState } from '@/store/sessionSlice';
import { ROUTES } from './paths';

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const sessionState = useAppSelector(selectSessionState);
  const dispatch = useAppDispatch();
  const location = useLocation();

  if (sessionState === 'checking') {
    return <p role="status">Checking your session…</p>;
  }

  if (sessionState === 'unauthenticated') {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  if ('user' in sessionState) {
    if (requiredRole && sessionState.user.role !== requiredRole) {
      return <Navigate to={ROUTES.forbidden} replace />;
    }

    return children;
  }

  return (
    <main>
      <p role="alert">Unable to verify your session: {sessionState.error}</p>
      <button type="button" onClick={() => dispatch(checkSession())}>
        Try again
      </button>
    </main>
  );
}
