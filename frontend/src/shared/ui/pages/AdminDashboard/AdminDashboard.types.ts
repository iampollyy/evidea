import type {
  DoctorAction,
  DoctorMetrics,
  DoctorRecord,
  DoctorRoleFilter,
  DoctorStatusFilter,
} from '@/shared/api/doctors.types';
import type { AddDoctorFormValues } from '@/shared/ui/components/AddDoctorForm/AddDoctorForm';

export interface DoctorFilters {
  status: DoctorStatusFilter;
  role: DoctorRoleFilter;
  search: string;
  page: number;
}

export interface StatusTab {
  value: DoctorStatusFilter;
  label: string;
}

export interface RoleFilterOption {
  value: DoctorRoleFilter;
  label: string;
}

export interface PageControl {
  label: string;
  targetPage: number;
  disabled: boolean;
}

export interface AdminDashboardProps {
  metrics: DoctorMetrics | null;
  doctors: DoctorRecord[];
  filters: DoctorFilters;
  totalPages: number;
  totalItems: number;
  pendingDoctorId?: string | null;
  isLoading?: boolean;
  error?: string | null;
  notice?: string | null;
  isAddDoctorOpen?: boolean;
  isAddingDoctor?: boolean;
  addDoctorError?: string | null;
  onRetry?: () => void;
  onFiltersChange?: (patch: Partial<DoctorFilters>) => void;
  onAddDoctorOpen?: () => void;
  onAddDoctorCancel?: () => void;
  onAddDoctorSubmit?: (values: AddDoctorFormValues) => void;
  onDoctorAction?: (doctor: DoctorRecord, action: DoctorAction) => void;
}
