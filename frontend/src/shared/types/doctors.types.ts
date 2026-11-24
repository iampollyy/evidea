import type { DOCTOR_ROLES, DOCTOR_STATUSES } from '@/constants/doctor.constants';
import type { PageMeta } from './common.types';
import type { Sex } from './person.types';

export type DoctorRole = (typeof DOCTOR_ROLES)[number];
export type DoctorStatus = (typeof DOCTOR_STATUSES)[number];
export type DoctorStatusFilter = 'all' | DoctorStatus;
export type DoctorRoleFilter = 'all' | DoctorRole;
export type DoctorStatusAction = 'activate' | 'deactivate';
export type DoctorAction = DoctorStatusAction | 'resend-invitation';

export interface DoctorRecord {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: DoctorRole;
  status: DoctorStatus;
  avatarUrl: string | null;
  createdOn: string;
}

export interface DoctorsPage {
  items: DoctorRecord[];
  meta: PageMeta;
}

export type DoctorMetrics = Record<DoctorStatusFilter, number>;

export interface DoctorCreateInput {
  name: string;
  surname: string;
  email: string;
  role: DoctorRole;
  birthDate?: string;
  sex?: Sex;
  phoneNumber?: string;
}

export interface ListDoctorsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: DoctorStatus;
  role?: DoctorRole;
  signal?: AbortSignal;
}
