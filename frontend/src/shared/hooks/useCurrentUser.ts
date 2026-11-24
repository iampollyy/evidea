import type { CurrentUser } from '@/shared/types/auth.types';
import { useAppSelector } from '@/store/hooks';
import { selectSessionState } from '@/store/sessionSlice';

export function useCurrentUser(): CurrentUser {
  const sessionState = useAppSelector(selectSessionState);
  if (typeof sessionState !== 'object' || !('user' in sessionState)) {
    throw new Error('useCurrentUser must be used inside ProtectedRoute');
  }
  return sessionState.user;
}
