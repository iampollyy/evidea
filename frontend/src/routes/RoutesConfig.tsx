import type { JSX } from 'react';
import { Navigate } from 'react-router-dom';

import { AdminDashboardPage } from '@/shared/ui/pages/AdminDashboard/AdminDashboardPage';
import { AdminLayoutRoute } from './AdminLayoutRoute';
import { ROUTES } from './paths';
import { ForbiddenPage, HomeRoute, LoginRoute } from './RoutePages';

export type RouteAccess = 'public' | 'authenticated' | 'admin';

interface IRoute {
  path?: string;
  index?: boolean;
  element: JSX.Element;
  access?: RouteAccess;
  children?: IRoute[];
}

export const routesConfig: IRoute[] = [
  {
    path: ROUTES.login,
    element: <LoginRoute />,
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
    element: <AdminLayoutRoute />,
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
];

export type { IRoute };
