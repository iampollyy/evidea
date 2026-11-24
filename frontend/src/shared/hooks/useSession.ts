import { useContext } from 'react';

import { SessionContext } from '@/context/SessionContext';
import type { SessionContextValue } from '@/shared/types/session.types';

export function useSession(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return session;
}
