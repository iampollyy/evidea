import { PAGE_TITLES } from '@/constants/pageTitles.constants';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePatientProfile } from '@/shared/hooks/usePatientProfile';
import type { PatientProfilePageProps } from '@/shared/types/patientProfile.types';
import { PatientProfile } from '@/shared/ui/organisms/PatientProfile/PatientProfile';

export function PatientProfilePage({ patientId, ...navigation }: PatientProfilePageProps) {
  useDocumentTitle(PAGE_TITLES.patientProfile);
  const profile = usePatientProfile(patientId);

  return <PatientProfile {...navigation} {...profile} />;
}
