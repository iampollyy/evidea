import type { Option } from '@/shared/types/common.types';
import type { DoctorAction, DoctorRole, DoctorStatus } from '@/shared/types/doctors.types';
import type { BadgeVariant } from '@/shared/ui/atoms/Badge/Badge';

export const DOCTOR_ROLES = ['clinician', 'admin'] as const;
export const DOCTOR_STATUSES = ['active', 'invited', 'deactivated'] as const;

export const ROLE_LABELS: Record<DoctorRole, string> = {
  clinician: 'Clinician',
  admin: 'Admin',
};

export const ROLE_OPTIONS: Option<DoctorRole>[] = DOCTOR_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export const STATUS_LABELS: Record<DoctorStatus, string> = {
  active: 'Active',
  invited: 'Invitation pending',
  deactivated: 'Deactivated',
};

export const STATUS_BADGE_VARIANTS: Record<DoctorStatus, BadgeVariant> = {
  active: 'success',
  invited: 'warning',
  deactivated: 'neutral',
};

export const STATUS_ACTIONS: Record<DoctorStatus, DoctorAction> = {
  active: 'deactivate',
  invited: 'resend-invitation',
  deactivated: 'activate',
};

export const ACTION_LABELS: Record<DoctorAction, string> = {
  activate: 'Activate',
  deactivate: 'Deactivate',
  'resend-invitation': 'Resend invite',
};
