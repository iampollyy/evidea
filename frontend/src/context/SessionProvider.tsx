import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { getCurrentUser } from '@/api/auth';
import { INITIAL_SESSION_STATE, UNKNOWN_SESSION_ERROR } from '@/constants/session.constants';
import type { SessionContextValue, SessionProviderProps } from '@/shared/types/session.types';
import { SessionContext } from './SessionContext';
import { sessionReducer } from './sessionReducer';

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessionState, dispatch] = useReducer(sessionReducer, INITIAL_SESSION_STATE);
  const [checkAttempt, setCheckAttempt] = useState(0);
  const checkRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    checkRef.current = controller;

    getCurrentUser(controller.signal)
      .then((user) => {
        if (controller.signal.aborted) return;
        dispatch(user ? { type: 'userSet', user } : { type: 'userCleared' });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        dispatch({
          type: 'checkFailed',
          error: error instanceof Error ? error.message : UNKNOWN_SESSION_ERROR,
        });
      });

    return () => controller.abort();
  }, [checkAttempt]);

  const value = useMemo<SessionContextValue>(
    () => ({
      sessionState,
      setUser: (user) => {
        checkRef.current?.abort();
        dispatch({ type: 'userSet', user });
      },
      updateUser: (patch) => dispatch({ type: 'userUpdated', patch }),
      clearUser: () => {
        checkRef.current?.abort();
        dispatch({ type: 'userCleared' });
      },
      retrySession: () => {
        dispatch({ type: 'checkStarted' });
        setCheckAttempt((attempt) => attempt + 1);
      },
    }),
    [sessionState],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
