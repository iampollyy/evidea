import { useEffect, useState } from 'react';

import { getCurrentUser } from '@/api/auth';
import type { SessionState } from '@/types/routes.types';

export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [retry, setRetry] = useState(0);

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

  const retrySession = () => {
    setSessionState('checking');
    setRetry((attempt) => attempt + 1);
  };

  return { sessionState, retrySession };
}
