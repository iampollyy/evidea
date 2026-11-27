import type { UserRole } from '@/shared/types/auth.types';

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
    caseReview: '/doctor/patients/:patientId/cases/:caseId/review',
  },
} as const;

export function patientProfilePath(patientId: string, tab = 'overview') {
  return `/doctor/patients/${encodeURIComponent(patientId)}/${tab}`;
}

export function caseReviewPath(patientId: string, caseId: string) {
  return `/doctor/patients/${encodeURIComponent(patientId)}/cases/${encodeURIComponent(caseId)}/review`;
}

export const HOME_PATH_BY_ROLE: Record<UserRole, string> = {
  admin: ROUTES.admin.root,
  clinician: ROUTES.doctor.root,
};
