import type { PatientFilters } from '@/shared/types/doctorDashboard.types';
import type { PatientStatus } from '@/shared/types/patients.types';
import type { FilterOption } from '@/shared/ui/atoms/Filter/Filter';
import type { LayoutOption } from '@/shared/ui/atoms/LayoutOptions/LayoutOptions';

export const PAGE_SIZE = 15;
export const MIN_SEARCH_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 100;

export const INITIAL_FILTERS: PatientFilters = {
  status: 'active',
  search: '',
  page: 1,
};

export const STATUS_FILTER_OPTIONS: FilterOption<PatientStatus>[] = [
  { value: 'active', label: 'Active patients' },
  { value: 'archived', label: 'Archived patients' },
];

export const LAYOUT_TITLES: Record<LayoutOption, string> = {
  grid: 'Patient Grid',
  list: 'Patient List',
};

export const PATIENT_ADDED_NOTICE = 'Patient added.';
