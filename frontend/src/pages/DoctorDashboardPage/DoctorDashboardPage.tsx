import { useDoctorDashboard } from '@/shared/hooks/useDoctorDashboard';
import type { DoctorDashboardNavigationProps } from '@/shared/types/doctorDashboard.types';
import { DoctorDashboard } from '@/shared/ui/organisms/DoctorDashboard/DoctorDashboard';

export function DoctorDashboardPage(navigation: DoctorDashboardNavigationProps) {
  const dashboard = useDoctorDashboard();

  return <DoctorDashboard {...dashboard} {...navigation} />;
}
