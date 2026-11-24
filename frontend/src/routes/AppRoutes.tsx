import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import type { IRoute, RouteAccess } from '@/shared/types/routes.types';
import { ROUTES } from './paths';
import { ProtectedRoute } from './ProtectedRoute';
import { routesConfig } from './RoutesConfig';

const guards: Record<RouteAccess, (element: ReactNode) => ReactNode> = {
  public: (element) => element,
  authenticated: (element) => <ProtectedRoute>{element}</ProtectedRoute>,
  admin: (element) => <ProtectedRoute requiredRole="admin">{element}</ProtectedRoute>,
  clinician: (element) => <ProtectedRoute requiredRole="clinician">{element}</ProtectedRoute>,
};

function renderRoute({ path, index, element, access = 'public', children }: IRoute) {
  const guardedElement = guards[access](element);

  if (index) {
    return <Route key="index" index element={guardedElement} />;
  }

  return (
    <Route key={path} path={path} element={guardedElement}>
      {children?.map(renderRoute)}
    </Route>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {routesConfig.map(renderRoute)}
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
