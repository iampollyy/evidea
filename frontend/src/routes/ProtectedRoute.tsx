import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { checkSession } from '@/shared/api/auth';

type SessionState = 'checking' | 'authenticated' | 'unauthenticated' | { error: string };

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [retry, setRetry] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();

    void checkSession(controller.signal)
      .then((authenticated) => {
        setSessionState(authenticated ? 'authenticated' : 'unauthenticated');
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (typeof sessionState === 'object') {
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

  return children;
}
