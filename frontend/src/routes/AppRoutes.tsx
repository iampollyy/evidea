import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './ProtectedRoute';
import { routesConfig, type RouteAccess } from './RoutesConfig';

function wrapWithGuard(element: ReactNode, access: RouteAccess) {
  switch (access) {
    case 'protected':
      return <ProtectedRoute>{element}</ProtectedRoute>;
    default:
      return element;
  }
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {routesConfig.map(({ path, element, access }) => (
          <Route key={path} path={path} element={wrapWithGuard(element, access)} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
