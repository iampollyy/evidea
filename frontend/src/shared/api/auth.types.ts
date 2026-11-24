import type { DoctorRole } from './doctors.types';

export type UserRole = DoctorRole;

export interface CurrentUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
