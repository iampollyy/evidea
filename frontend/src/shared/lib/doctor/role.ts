import { DOCTOR_ROLES, type DoctorRole } from '@/shared/api/doctors.types';

export const ROLE_LABELS: Record<DoctorRole, string> = {
  clinician: 'Clinician',
  admin: 'Admin',
};

export const ROLE_OPTIONS: { value: DoctorRole; label: string }[] = DOCTOR_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));
