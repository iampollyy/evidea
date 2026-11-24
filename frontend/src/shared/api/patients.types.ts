import type { Sex } from '@/shared/lib/person/sex';
import type { PageMeta } from './doctors.types';

export const PATIENT_STATUSES = ['active', 'archived'] as const;
export const SEXES = ['male', 'female', 'other', 'unknown'] as const;

export type PatientStatus = (typeof PATIENT_STATUSES)[number];
export type PatientSort = 'name' | '-createdOn' | '-lastVisitAt';

export interface PatientListItem {
  id: string;
  name: string;
  surname: string;
  age: number;
  sex: Sex;
  status: PatientStatus;
  photoUrl: string | null;
  lastVisitAt: string | null;
}

export interface PatientsPage {
  items: PatientListItem[];
  meta: PageMeta;
}

export interface PatientCreateInput {
  name: string;
  surname: string;
  birthDate: string;
  sex: Sex;
  email: string;
  phoneNumber: string | null;
}

export interface ListPatientsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PatientStatus;
  sort?: PatientSort;
  signal?: AbortSignal;
}
