import type { SidebarNavItem } from '@/ui/components/SidebarNav/SidebarNav';
import { ROUTES } from './paths';

export const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'doctors', label: 'Doctors', icon: 'group', href: ROUTES.admin.doctors },
];
