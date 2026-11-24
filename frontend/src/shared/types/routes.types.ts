import type { JSX, ReactNode } from 'react';
import type { Location } from 'react-router-dom';

import type { SidebarNavItem } from '@/ui/components/SidebarNav/SidebarNav';
import type { CurrentUser, UserRole } from './auth.types';

export type RouteAccess = 'public' | 'authenticated' | 'admin' | 'clinician';

export interface IRoute {
  path?: string;
  index?: boolean;
  element: JSX.Element;
  access?: RouteAccess;
  children?: IRoute[];
}

export type SessionState = 'checking' | { user: CurrentUser } | 'unauthenticated' | { error: string };

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export interface WorkspaceLayoutRouteProps {
  navItems: SidebarNavItem[];
  homeHref: string;
}

export type LoginLocationState = { from?: Pick<Location, 'pathname' | 'search' | 'hash'> } | null;
