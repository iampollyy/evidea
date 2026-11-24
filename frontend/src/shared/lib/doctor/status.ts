import type { DoctorAction, DoctorStatus } from '@/shared/api/doctors.types';
import type { BadgeVariant } from '@/shared/ui/atoms/Badge/Badge';

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
