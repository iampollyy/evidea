import { PatientProfile } from './PatientProfile';
import type { PatientProfileNavigationProps } from './PatientProfile.types';
import { usePatientProfile } from './usePatientProfile';

export interface PatientProfilePageProps extends PatientProfileNavigationProps {
  patientId: string;
}

export function PatientProfilePage({ patientId, ...navigation }: PatientProfilePageProps) {
  const profile = usePatientProfile(patientId);

  return <PatientProfile {...navigation} {...profile} />;
}
