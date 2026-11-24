import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { getCurrentUser } from '@/shared/api/auth';
import type { CurrentUser, UserRole } from '@/shared/api/auth.types';
import { CurrentUserContext } from './CurrentUserContext';
import { ROUTES } from './paths';

type SessionState = 'checking' | { user: CurrentUser } | 'unauthenticated' | { error: string };

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [retry, setRetry] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();

    void getCurrentUser(controller.signal)
      .then((user) => {
        setSessionState(user ? { user } : 'unauthenticated');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSessionState({
          error: error instanceof Error ? error.message : 'Unknown session check error',
        });
      });

    return () => controller.abort();
  }, [retry]);

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
        <button
          type="button"
          onClick={() => {
            setSessionState('checking');
            setRetry((attempt) => attempt + 1);
          }}
        >
          Try again
        </button>
      </main>
    );
  }

  return null;
}
