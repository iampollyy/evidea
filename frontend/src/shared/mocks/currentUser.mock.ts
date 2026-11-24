import type { CurrentUser } from '@/shared/api/auth.types';

export const adminUserMock: CurrentUser = {
  id: 'admin-1',
  name: 'Polly',
  surname: 'Trybialustava',
  email: 'polly@clinic.example',
  role: 'admin',
  avatarUrl: null,
};
