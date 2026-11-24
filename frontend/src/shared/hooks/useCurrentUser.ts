import type { CurrentUser } from '@/shared/types/auth.types';
import { useSession } from './useSession';

export function useCurrentUser(): CurrentUser {
  const { sessionState } = useSession();
  if (typeof sessionState !== 'object' || !('user' in sessionState)) {
    throw new Error('useCurrentUser must be used inside ProtectedRoute');
  }
  return sessionState.user;
}
