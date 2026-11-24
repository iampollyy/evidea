import { usePatientProfile } from '@/hooks/usePatientProfile';
import type { PatientProfilePageProps } from '@/types/patientProfile.types';
import { PatientProfile } from '@/ui/organisms/PatientProfile/PatientProfile';

export function PatientProfilePage({ patientId, ...navigation }: PatientProfilePageProps) {
  const profile = usePatientProfile(patientId);

  return <PatientProfile {...navigation} {...profile} />;
}
