import type { PatientCreateInput, PatientListItem } from '@/shared/api/patients.types';
import { SEX_OPTIONS } from '@/shared/lib/person/sex';
import type { AddPatientFormValues } from '@/shared/ui/components/AddPatientForm/AddPatientForm';
import type { PatientsGridPatient } from '@/shared/ui/components/PatientsGrid/PatientsGrid';

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}

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

export function toPatientInput({
  name,
  surname,
  birthDate,
  sex,
  email,
  phoneNumber,
}: AddPatientFormValues): PatientCreateInput {
  if (!sex) {
    throw new Error('Select a sex before adding a patient.');
  }

  return {
    name,
    surname,
    birthDate,
    sex,
    email,
    phoneNumber: phoneNumber || null,
  };
}
