import { PAGE_TITLES } from '@/constants/pageTitles.constants';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useAdminDashboard } from '@/shared/hooks/useAdminDashboard';
import { AdminDashboard } from '@/shared/ui/organisms/AdminDashboard/AdminDashboard';

export function AdminDashboardPage() {
  useDocumentTitle(PAGE_TITLES.doctors);
  const dashboard = useAdminDashboard();

  return <AdminDashboard {...dashboard} />;
}
