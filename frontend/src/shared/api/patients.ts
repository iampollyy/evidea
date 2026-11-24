import {
  PATIENT_STATUSES,
  SEXES,
  type ListPatientsOptions,
  type PatientCreateInput,
  type PatientListItem,
  type PatientsPage,
} from './patients.types';

const PATIENTS_URL = '/api/v1/patients';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isPatientListItem(value: unknown): value is PatientListItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.surname === 'string' &&
    typeof value.age === 'number' &&
    isOneOf(SEXES, value.sex) &&
    isOneOf(PATIENT_STATUSES, value.status) &&
    isNullableString(value.photoUrl) &&
    isNullableString(value.lastVisitAt)
  );
}

function isPatientsPage(value: unknown): value is PatientsPage {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isPatientListItem) &&
    isRecord(value.meta) &&
    typeof value.meta.page === 'number' &&
    typeof value.meta.pageSize === 'number' &&
    typeof value.meta.totalItems === 'number' &&
    typeof value.meta.totalPages === 'number'
  );
}

export async function listPatients({
  page = 1,
  pageSize = 20,
  search,
  status,
  sort,
  signal,
}: ListPatientsOptions = {}): Promise<PatientsPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  Object.entries({ search, status, sort }).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const response = await fetch(`${PATIENTS_URL}?${params.toString()}`, {
    credentials: 'include',
    signal,
  });
  if (!response.ok) {
    throw new Error(`Unable to load patients: HTTP ${response.status}`);
  }

  const pageData: unknown = await response.json();
  if (!isPatientsPage(pageData)) {
    throw new Error('Unable to load patients: invalid response');
  }

  return pageData;
}

export async function createPatient(
  input: PatientCreateInput,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(PATIENTS_URL, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (response.status === 409) {
    throw new Error('Another active patient already uses this email.');
  }
  if (!response.ok) {
    throw new Error(`Unable to add patient: HTTP ${response.status}`);
  }
}
