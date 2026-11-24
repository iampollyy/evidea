import type { PatientListItem } from '@/shared/api/patients.types';
import { SEX_OPTIONS } from '@/shared/lib/person/sex';
import type { PatientsGridPatient } from '@/shared/ui/components/PatientsGrid/PatientsGrid';

export function toGridPatient({
  id,
  name,
  surname,
  age,
  sex,
  photoUrl,
  lastVisitAt,
}: PatientListItem): PatientsGridPatient {
  return {
    id,
    name: `${name} ${surname}`,
    age,
    gender: SEX_OPTIONS.find((option) => option.value === sex)?.label ?? sex,
    avatarSrc: photoUrl ?? undefined,
    lastAppointment: lastVisitAt ? new Date(lastVisitAt) : undefined,
  };
}
