import { useDoctorDashboard } from '@/hooks/useDoctorDashboard';
import type { DoctorDashboardNavigationProps } from '@/types/doctorDashboard.types';
import { DoctorDashboard } from '@/ui/organisms/DoctorDashboard/DoctorDashboard';

export function DoctorDashboardPage(navigation: DoctorDashboardNavigationProps) {
  const dashboard = useDoctorDashboard();

  return <DoctorDashboard {...dashboard} {...navigation} />;
}
