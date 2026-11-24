import type { PatientStatus } from '@/shared/api/patients.types';
import type { LayoutOption } from '@/shared/ui/atoms/LayoutOptions/LayoutOptions';
import type { AddPatientFormValues } from '@/shared/ui/components/AddPatientForm/AddPatientForm';
import type { PatientsGridPatient } from '@/shared/ui/components/PatientsGrid/PatientsGrid';

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
}
