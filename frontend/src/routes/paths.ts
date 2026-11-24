import type { UserRole } from '@/shared/api/auth.types';

export const ROUTES = {
  home: '/',
  login: '/login',
  forbidden: '/forbidden',
  admin: {
    root: '/admin',
    doctors: '/admin/doctors',
  },
} as const;

export const HOME_PATH_BY_ROLE: Record<UserRole, string> = {
  admin: ROUTES.admin.root,
  clinician: ROUTES.home,
};
