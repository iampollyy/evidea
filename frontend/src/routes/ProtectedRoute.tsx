import { Navigate, useLocation } from 'react-router-dom';

import { CurrentUserContext } from '@/context/CurrentUserContext';
import { useSession } from '@/hooks/useSession';
import type { ProtectedRouteProps } from '@/types/routes.types';
import { ROUTES } from './paths';

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { sessionState, retrySession } = useSession();
  const location = useLocation();

  if (sessionState === 'checking') {
    return <p role="status">Checking your session…</p>;
  }

  if (sessionState === 'unauthenticated') {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  if (typeof sessionState === 'object') {
    if ('user' in sessionState) {
      if (requiredRole && sessionState.user.role !== requiredRole) {
        return <Navigate to={ROUTES.forbidden} replace />;
      }

      return (
        <CurrentUserContext.Provider value={sessionState.user}>
          {children}
        </CurrentUserContext.Provider>
      );
    }

    return (
      <main>
        <p role="alert">Unable to verify your session: {sessionState.error}</p>
        <button type="button" onClick={retrySession}>
          Try again
        </button>
      </main>
    );
  }

  return null;
}
