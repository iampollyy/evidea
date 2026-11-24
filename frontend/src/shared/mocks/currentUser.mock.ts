import type { CurrentUser } from '@/shared/types/auth.types';

export const adminUserMock: CurrentUser = {
  id: 'admin-1',
  name: 'Polly',
  surname: 'Trybialustava',
  email: 'polly@clinic.example',
  role: 'admin',
  avatarUrl: null,
};

export const clinicianUserMock: CurrentUser = {
  id: 'doctor-1',
  name: 'Sarah',
  surname: 'Chen',
  email: 'sarah.chen@clinic.example',
  role: 'clinician',
  avatarUrl: null,
};
