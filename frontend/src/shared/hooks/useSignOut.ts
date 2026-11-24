import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logout } from '@/api/auth';
import { ROUTES } from '@/routes/paths';
import { useAppDispatch } from '@/store/hooks';
import { userCleared } from '@/store/sessionSlice';

export function useSignOut() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const signOut = async () => {
    setSignOutError(null);
    try {
      await logout();
      navigate(ROUTES.login, { replace: true });
      dispatch(userCleared());
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out');
    }
  };

  return { signOutError, signOut };
}
