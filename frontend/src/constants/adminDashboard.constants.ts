import type {
  DoctorFilters,
  RoleFilterOption,
  StatusTab,
} from '@/shared/types/adminDashboard.types';
import type { DoctorAction, DoctorRecord } from '@/shared/types/doctors.types';
import { DOCTOR_STATUSES, ROLE_OPTIONS, STATUS_LABELS } from './doctor.constants';

export const PAGE_SIZE = 10;
export const MIN_SEARCH_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 100;
export const SEARCH_DEBOUNCE_MS = 300;

export const INITIAL_FILTERS: DoctorFilters = {
  status: 'all',
  role: 'all',
  search: '',
  page: 1,
};

export const STATUS_TABS: StatusTab[] = [
  { value: 'all', label: 'All doctors' },
  ...DOCTOR_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
];

export const ROLE_FILTER_OPTIONS: RoleFilterOption[] = [
  { value: 'all', label: 'All roles' },
  ...ROLE_OPTIONS.map(({ value, label }) => ({ value, label: `${label}s` })),
];

export const ACTION_CONFIRMATIONS: Partial<Record<DoctorAction, (doctor: DoctorRecord) => string>> =
  {
    deactivate: (doctor) => `Deactivate ${doctor.name} ${doctor.surname}?`,
  };

export const ACTION_NOTICES: Record<DoctorAction, (doctor: DoctorRecord) => string> = {
  activate: () => 'Doctor activated.',
  deactivate: () => 'Doctor deactivated.',
  'resend-invitation': (doctor) => `Invitation resent to ${doctor.email}.`,
};

export const DOCTOR_ADDED_NOTICE = 'Doctor added and invitation sent.';
