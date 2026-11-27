import { Navigate } from 'react-router-dom';

import { AdminDashboardPage } from '@/pages/AdminDashboardPage/AdminDashboardPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage/ForbiddenPage';
import type { IRoute } from '@/shared/types/routes.types';
import { ADMIN_NAV_ITEMS } from './adminNav';
import { DOCTOR_NAV_ITEMS } from './doctorNav';
import { ROUTES } from './paths';
import {
  AcceptInvitationRoute,
  CaseReviewRoute,
  DoctorDashboardRoute,
  HomeRoute,
  LoginRoute,
  PatientProfileRoute,
} from './RoutePages';
import { WorkspaceLayoutRoute } from './WorkspaceLayoutRoute';

export const routesConfig: IRoute[] = [
  {
    path: ROUTES.login,
    element: <LoginRoute />,
    access: 'public',
  },
  {
    path: ROUTES.acceptInvitation,
    element: <AcceptInvitationRoute />,
    access: 'public',
  },
  {
    path: ROUTES.forbidden,
    element: <ForbiddenPage />,
    access: 'public',
  },
  {
    path: ROUTES.home,
    element: <HomeRoute />,
    access: 'authenticated',
  },
  {
    path: ROUTES.admin.root,
    element: <WorkspaceLayoutRoute navItems={ADMIN_NAV_ITEMS} homeHref={ROUTES.admin.root} />,
    access: 'admin',
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.admin.doctors} replace />,
      },
      {
        path: ROUTES.admin.doctors,
        element: <AdminDashboardPage />,
      },
    ],
  },
  {
    path: ROUTES.doctor.root,
    element: <WorkspaceLayoutRoute navItems={DOCTOR_NAV_ITEMS} homeHref={ROUTES.doctor.root} />,
    access: 'clinician',
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.doctor.dashboard} replace />,
      },
      {
        path: ROUTES.doctor.dashboard,
        element: <DoctorDashboardRoute />,
      },
      {
        path: ROUTES.doctor.patient,
        element: <PatientProfileRoute />,
      },
      {
        path: ROUTES.doctor.patientTab,
        element: <PatientProfileRoute />,
      },
      {
        path: ROUTES.doctor.caseReview,
        element: <CaseReviewRoute />,
      },
    ],
  },
];
