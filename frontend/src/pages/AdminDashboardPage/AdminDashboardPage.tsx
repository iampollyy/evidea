import { useAdminDashboard } from '@/shared/hooks/useAdminDashboard';
import { AdminDashboard } from '@/shared/ui/organisms/AdminDashboard/AdminDashboard';

export function AdminDashboardPage() {
  const dashboard = useAdminDashboard();

  return <AdminDashboard {...dashboard} />;
}
