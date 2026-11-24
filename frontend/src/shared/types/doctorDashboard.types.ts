import type { MouseEvent } from 'react';

import type { LayoutOption } from '@/shared/ui/atoms/LayoutOptions/LayoutOptions';
import type { PatientsGridPatient } from '@/shared/ui/components/PatientsGrid/PatientsGrid';
import type { AddPatientFormValues } from './forms.types';
import type { PatientStatus } from './patients.types';

export interface PatientFilters {
  status: PatientStatus;
  search: string;
  page: number;
}

export interface DoctorDashboardProps {
  patients: PatientsGridPatient[];
  filters: PatientFilters;
  layout: LayoutOption;
  totalPages: number;
  totalItems: number;
  isLoading?: boolean;
  error?: string | null;
  notice?: string | null;
  isAddPatientOpen?: boolean;
  isAddingPatient?: boolean;
  addPatientError?: string | null;
  onRetry?: () => void;
  onFiltersChange?: (patch: Partial<PatientFilters>) => void;
  onLayoutChange?: (layout: LayoutOption) => void;
  onAddPatientOpen?: () => void;
  onAddPatientCancel?: () => void;
  onAddPatientSubmit?: (values: AddPatientFormValues) => void;
  getPatientHref?: (patient: PatientsGridPatient) => string;
  onPatientOpen?: (patient: PatientsGridPatient, event: MouseEvent<HTMLAnchorElement>) => void;
}

export type DoctorDashboardNavigationProps = Pick<
  DoctorDashboardProps,
  'getPatientHref' | 'onPatientOpen'
>;
