import {
  PATIENT_STATUSES,
  SEXES,
  type ListPatientsOptions,
  type PatientCreateInput,
  type PatientDetail,
  type PatientListItem,
  type PatientReplaceInput,
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

function isPatientDetail(value: unknown): value is PatientDetail {
  return (
    isPatientListItem(value) &&
    isRecord(value) &&
    typeof value.birthDate === 'string' &&
    typeof value.email === 'string' &&
    isNullableString(value.phoneNumber) &&
    typeof value.createdOn === 'string' &&
    isNullableString(value.archivedAt)
  );
}

async function readErrorCode(response: Response) {
  try {
    const body: unknown = await response.json();
    return isRecord(body) && typeof body.code === 'string' ? body.code : null;
  } catch {
    return null;
  }
}

function patientUrl(patientId: string) {
  return `${PATIENTS_URL}/${encodeURIComponent(patientId)}`;
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

export async function getPatient(patientId: string, signal?: AbortSignal): Promise<PatientDetail> {
  const response = await fetch(patientUrl(patientId), { credentials: 'include', signal });
  if (response.status === 404) {
    throw new Error('Patient not found.');
  }
  if (!response.ok) {
    throw new Error(`Unable to load patient: HTTP ${response.status}`);
  }

  const patient: unknown = await response.json();
  if (!isPatientDetail(patient)) {
    throw new Error('Unable to load patient: invalid response');
  }

  return patient;
}

const REPLACE_CONFLICTS: Record<string, string> = {
  EMAIL_ALREADY_USED: 'Another active patient already uses this email.',
  PATIENT_ARCHIVED: 'Archived patients cannot be changed.',
};

export async function replacePatient(
  patientId: string,
  input: PatientReplaceInput,
  signal?: AbortSignal,
): Promise<PatientDetail> {
  const response = await fetch(patientUrl(patientId), {
    method: 'PUT',
    credentials: 'include',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (response.status === 409) {
    const code = await readErrorCode(response);
    throw new Error(
      (code && REPLACE_CONFLICTS[code]) ?? 'Patient details conflict with existing data.',
    );
  }
  if (!response.ok) {
    throw new Error(`Unable to save patient: HTTP ${response.status}`);
  }

  const patient: unknown = await response.json();
  if (!isPatientDetail(patient)) {
    throw new Error('Unable to save patient: invalid response');
  }

  return patient;
}
