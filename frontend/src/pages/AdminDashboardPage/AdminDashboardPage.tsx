import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { AdminDashboard } from '@/ui/organisms/AdminDashboard/AdminDashboard';

export function AdminDashboardPage() {
  const dashboard = useAdminDashboard();

  return <AdminDashboard {...dashboard} />;
}
