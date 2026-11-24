import type { DoctorCreateInput } from '@/shared/api/doctors.types';
import type { AddDoctorFormValues } from '@/shared/ui/components/AddDoctorForm/AddDoctorForm';

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}

export function toDoctorInput({
  name,
  surname,
  email,
  role,
  birthDate,
  sex,
  phoneNumber,
}: AddDoctorFormValues): DoctorCreateInput {
  if (!role) {
    throw new Error('Select a role before adding a doctor.');
  }

  return {
    name,
    surname,
    email,
    role,
    ...(birthDate && { birthDate }),
    ...(sex && { sex }),
    ...(phoneNumber && { phoneNumber }),
  };
}
