import { PAGE_TITLES } from '@/constants/pageTitles.constants';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useDoctorDashboard } from '@/shared/hooks/useDoctorDashboard';
import type { DoctorDashboardNavigationProps } from '@/shared/types/doctorDashboard.types';
import { DoctorDashboard } from '@/shared/ui/organisms/DoctorDashboard/DoctorDashboard';

export function DoctorDashboardPage(navigation: DoctorDashboardNavigationProps) {
  useDocumentTitle(PAGE_TITLES.patients);
  const dashboard = useDoctorDashboard();

  return <DoctorDashboard {...dashboard} {...navigation} />;
}
