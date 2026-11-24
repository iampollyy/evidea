import type { SidebarNavItem } from '@/shared/ui/components/SidebarNav/SidebarNav';
import { ROUTES } from './paths';

export const DOCTOR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid_view', href: ROUTES.doctor.dashboard },
];
