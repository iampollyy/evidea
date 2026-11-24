import type { CurrentUser } from '@/shared/types/auth.types';

export function createUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: 'user-1',
    name: 'Anna',
    surname: 'Novak',
    email: 'anna.novak@clinic.example',
    role: 'clinician',
    avatarUrl: null,
    ...overrides,
  };
}
