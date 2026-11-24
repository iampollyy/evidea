import type { Option } from './common.types';
import type {
  DoctorAction,
  DoctorMetrics,
  DoctorRecord,
  DoctorRoleFilter,
  DoctorStatusFilter,
} from './doctors.types';
import type { AddDoctorFormValues } from './forms.types';

export interface DoctorFilters {
  status: DoctorStatusFilter;
  role: DoctorRoleFilter;
  search: string;
  page: number;
}

export type StatusTab = Option<DoctorStatusFilter>;

export type RoleFilterOption = Option<DoctorRoleFilter>;

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
