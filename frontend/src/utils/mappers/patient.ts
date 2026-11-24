import type { AddPatientFormValues, PersonalInfoValues } from '@/types/forms.types';
import type { PatientCreateInput, PatientDetail, PatientListItem } from '@/types/patients.types';
import type { PatientBannerPatient } from '@/ui/components/PatientBanner/PatientBanner';
import type { PatientsGridPatient } from '@/ui/components/PatientsGrid/PatientsGrid';
import { getSexLabel } from '@/utils/sex';

export function toPatientInput({
  name,
  surname,
  birthDate,
  sex,
  email,
  phoneNumber,
}: AddPatientFormValues): PatientCreateInput {
  if (!sex) {
    throw new Error('Select a sex.');
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
    gender: getSexLabel(sex) ?? sex,
    avatarSrc: photoUrl ?? undefined,
    lastAppointment: lastVisitAt ? new Date(lastVisitAt) : undefined,
  };
}

export function toPatientCode(patientId: string) {
  return `#${patientId.slice(0, 8).toUpperCase()}`;
}

export function toBannerPatient(patient: PatientDetail): PatientBannerPatient {
  return {
    code: toPatientCode(patient.id),
    name: patient.name,
    surname: patient.surname,
    birthDate: patient.birthDate,
    sex: patient.sex,
    status: patient.status,
    phoneNumber: patient.phoneNumber,
    lastVisit: patient.lastVisitAt ? new Date(patient.lastVisitAt) : null,
    photoSrc: patient.photoUrl ?? undefined,
  };
}

export function toPersonalInfoValues(patient: PatientDetail): PersonalInfoValues {
  return {
    name: patient.name,
    surname: patient.surname,
    birthDate: patient.birthDate,
    sex: patient.sex,
    email: patient.email,
    phoneNumber: patient.phoneNumber ?? '',
  };
}
