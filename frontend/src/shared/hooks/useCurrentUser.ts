import { useContext } from 'react';

import { CurrentUserContext } from '@/context/CurrentUserContext';
import type { CurrentUser } from '@/shared/types/auth.types';

export function useCurrentUser(): CurrentUser {
  const user = useContext(CurrentUserContext);
  if (!user) {
    throw new Error('useCurrentUser must be used inside ProtectedRoute');
  }
  return user;
}
