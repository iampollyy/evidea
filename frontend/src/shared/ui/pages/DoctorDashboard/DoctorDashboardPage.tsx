import { DoctorDashboard } from './DoctorDashboard';
import type { DoctorDashboardNavigationProps } from './DoctorDashboard.types';
import { useDoctorDashboard } from './useDoctorDashboard';

export function DoctorDashboardPage(navigation: DoctorDashboardNavigationProps) {
  const dashboard = useDoctorDashboard();

  return <DoctorDashboard {...dashboard} {...navigation} />;
}
