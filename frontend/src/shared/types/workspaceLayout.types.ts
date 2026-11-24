import type { ReactNode } from 'react';

import type { CurrentUser } from './auth.types';
import type { SidebarNavItem, SidebarNavProps } from '@/ui/components/SidebarNav/SidebarNav';

export interface WorkspaceLayoutProps {
  user: CurrentUser;
  navItems: SidebarNavItem[];
  activeNavId?: string;
  homeHref: string;
  signOutError?: string | null;
  onNavigate?: SidebarNavProps['onNavigate'];
  onSignOut: () => void;
  children: ReactNode;
}
