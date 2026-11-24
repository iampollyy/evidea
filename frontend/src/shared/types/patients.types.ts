import type { PATIENT_STATUSES } from '@/constants/patient.constants';
import type { PageMeta } from './common.types';
import type { Sex } from './person.types';

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

export interface PatientDetail extends PatientListItem {
  birthDate: string;
  email: string;
  phoneNumber: string | null;
  createdOn: string;
  archivedAt: string | null;
}

export type PatientReplaceInput = PatientCreateInput;

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
