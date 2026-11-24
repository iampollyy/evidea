import type { UserRole } from '@/shared/api/auth.types';

export const ROUTES = {
  home: '/',
  login: '/login',
  acceptInvitation: '/accept-invitation',
  forbidden: '/forbidden',
  admin: {
    root: '/admin',
    doctors: '/admin/doctors',
  },
  doctor: {
    root: '/doctor',
    dashboard: '/doctor/dashboard',
    patient: '/doctor/patients/:patientId',
    patientTab: '/doctor/patients/:patientId/:tab',
  },
} as const;

export function patientProfilePath(patientId: string, tab = 'overview') {
  return `/doctor/patients/${encodeURIComponent(patientId)}/${tab}`;
}

export const HOME_PATH_BY_ROLE: Record<UserRole, string> = {
  admin: ROUTES.admin.root,
  clinician: ROUTES.doctor.root,
};
