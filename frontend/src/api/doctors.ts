import { DOCTOR_ROLES, DOCTOR_STATUSES } from '@/constants/doctor.constants';
import type {
  DoctorAction,
  DoctorCreateInput,
  DoctorMetrics,
  DoctorRecord,
  DoctorStatusAction,
  DoctorStatusFilter,
  DoctorsPage,
  ListDoctorsOptions,
} from '@/shared/types/doctors.types';
import { isOneOf, isRecord } from '@/utils/typeGuards';

const DOCTORS_URL = '/api/v1/doctors';

function isDoctorRecord(value: unknown): value is DoctorRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.surname === 'string' &&
    typeof value.email === 'string' &&
    isOneOf(DOCTOR_ROLES, value.role) &&
    isOneOf(DOCTOR_STATUSES, value.status) &&
    (typeof value.avatarUrl === 'string' || value.avatarUrl === null) &&
    typeof value.createdOn === 'string'
  );
}

function isDoctorsPage(value: unknown): value is DoctorsPage {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isDoctorRecord) &&
    isRecord(value.meta) &&
    typeof value.meta.page === 'number' &&
    typeof value.meta.pageSize === 'number' &&
    typeof value.meta.totalItems === 'number' &&
    typeof value.meta.totalPages === 'number'
  );
}

function doctorUrl(doctorId: string, path: string) {
  return `${DOCTORS_URL}/${encodeURIComponent(doctorId)}/${path}`;
}

async function post(url: string, action: string, signal?: AbortSignal, body?: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    signal,
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    throw new Error(`${action}: HTTP ${response.status}`);
  }
}

export async function listDoctors({
  page = 1,
  pageSize = 10,
  search,
  status,
  role,
  signal,
}: ListDoctorsOptions = {}): Promise<DoctorsPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  Object.entries({ search, status, role }).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const response = await fetch(`${DOCTORS_URL}?${params.toString()}`, {
    credentials: 'include',
    signal,
  });
  if (!response.ok) {
    throw new Error(`Unable to load doctors: HTTP ${response.status}`);
  }

  const pageData: unknown = await response.json();
  if (!isDoctorsPage(pageData)) {
    throw new Error('Unable to load doctors: invalid response');
  }

  return pageData;
}

export async function getDoctorMetrics(signal?: AbortSignal): Promise<DoctorMetrics> {
  const filters: DoctorStatusFilter[] = ['all', ...DOCTOR_STATUSES];
  const pages = await Promise.all(
    filters.map((filter) =>
      listDoctors({ pageSize: 1, status: filter === 'all' ? undefined : filter, signal }),
    ),
  );

  return Object.fromEntries(
    filters.map((filter, index) => [filter, pages[index].meta.totalItems]),
  ) as DoctorMetrics;
}

export function createDoctor(input: DoctorCreateInput, signal?: AbortSignal): Promise<void> {
  return post(DOCTORS_URL, 'Unable to add doctor', signal, input);
}

export function updateDoctorStatus(
  doctorId: string,
  action: DoctorStatusAction,
  signal?: AbortSignal,
): Promise<void> {
  return post(doctorUrl(doctorId, action), 'Unable to update doctor status', signal);
}

export function resendDoctorInvitation(doctorId: string, signal?: AbortSignal): Promise<void> {
  return post(doctorUrl(doctorId, 'invitations'), 'Unable to resend invitation', signal);
}

const doctorActionRequests: Record<
  DoctorAction,
  (doctorId: string, signal?: AbortSignal) => Promise<void>
> = {
  activate: (doctorId, signal) => updateDoctorStatus(doctorId, 'activate', signal),
  deactivate: (doctorId, signal) => updateDoctorStatus(doctorId, 'deactivate', signal),
  'resend-invitation': resendDoctorInvitation,
};

export function runDoctorAction(
  doctorId: string,
  action: DoctorAction,
  signal?: AbortSignal,
): Promise<void> {
  return doctorActionRequests[action](doctorId, signal);
}
