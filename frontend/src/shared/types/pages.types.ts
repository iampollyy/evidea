import type { CurrentUser } from './auth.types';

export interface LoginPageProps {
  onLoginSuccess?: (user: CurrentUser) => void;
}

export interface SetPasswordPageProps {
  token: string | null;
  onGoToLogin: () => void;
}
