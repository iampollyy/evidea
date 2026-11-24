import { usePatientProfile } from '@/shared/hooks/usePatientProfile';
import type { PatientProfilePageProps } from '@/shared/types/patientProfile.types';
import { PatientProfile } from '@/shared/ui/organisms/PatientProfile/PatientProfile';

export function PatientProfilePage({ patientId, ...navigation }: PatientProfilePageProps) {
  const profile = usePatientProfile(patientId);

  return <PatientProfile {...navigation} {...profile} />;
}
