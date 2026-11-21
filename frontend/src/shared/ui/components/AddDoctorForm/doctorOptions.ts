export type DoctorRole = 'clinician' | 'admin';

export const ROLE_OPTIONS: { value: DoctorRole; label: string }[] = [
  { value: 'clinician', label: 'Clinician' },
  { value: 'admin', label: 'Admin' },
];
