import type { JSX } from 'react';

import { LoginRoute, ProtectedHomePage } from './RoutePages';

export type RouteAccess = 'public' | 'protected';

interface IRoute {
  path: string;
  element: JSX.Element;
  access: RouteAccess;
}

export const routesConfig: IRoute[] = [
  {
    path: '/login',
    element: <LoginRoute />,
    access: 'public',
  },
  {
    path: '/',
    element: <ProtectedHomePage />,
    access: 'protected',
  },
];

export type { IRoute };
