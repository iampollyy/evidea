import type { ReactNode } from 'react';

import type { CurrentUser } from './auth.types';

export type SessionState =
  'checking' | { user: CurrentUser } | 'unauthenticated' | { error: string };

export type CurrentUserPatch = Partial<Omit<CurrentUser, 'id'>>;

export type SessionAction =
  | { type: 'checkStarted' }
  | { type: 'checkFailed'; error: string }
  | { type: 'userSet'; user: CurrentUser }
  | { type: 'userUpdated'; patch: CurrentUserPatch }
  | { type: 'userCleared' };

export interface SessionContextValue {
  sessionState: SessionState;
  setUser: (user: CurrentUser) => void;
  updateUser: (patch: CurrentUserPatch) => void;
  clearUser: () => void;
  retrySession: () => void;
}

export interface SessionProviderProps {
  children: ReactNode;
}
