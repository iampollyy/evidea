import { AdminDashboard } from './AdminDashboard';
import { useAdminDashboard } from './useAdminDashboard';

export function AdminDashboardPage() {
  const dashboard = useAdminDashboard();

  return <AdminDashboard {...dashboard} />;
}
