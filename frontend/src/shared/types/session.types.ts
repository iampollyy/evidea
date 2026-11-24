import type { CurrentUser } from './auth.types';

export type SessionState =
  'checking' | { user: CurrentUser } | 'unauthenticated' | { error: string };

export type CurrentUserPatch = Partial<Omit<CurrentUser, 'id'>>;
