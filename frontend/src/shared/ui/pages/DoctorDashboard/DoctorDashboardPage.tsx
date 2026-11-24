import { DoctorDashboard } from './DoctorDashboard';
import { useDoctorDashboard } from './useDoctorDashboard';

export function DoctorDashboardPage() {
  const dashboard = useDoctorDashboard();

  return <DoctorDashboard {...dashboard} />;
}
