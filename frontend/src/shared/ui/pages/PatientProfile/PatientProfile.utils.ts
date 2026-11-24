import type { PatientDetail } from '@/shared/api/patients.types';
import type { PatientBannerPatient } from '@/shared/ui/components/PatientBanner/PatientBanner';
import type { PersonalInfoValues } from '@/shared/ui/organisms/PersonalInfoForm/PersonalInfoForm';

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
