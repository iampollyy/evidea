import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logout } from '@/api/auth';
import { ROUTES } from '@/routes/paths';

export function useSignOut() {
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const signOut = async () => {
    setSignOutError(null);
    try {
      await logout();
      navigate(ROUTES.login, { replace: true });
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out');
    }
  };

  return { signOutError, signOut };
}
