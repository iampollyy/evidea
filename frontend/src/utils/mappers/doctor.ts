import type { DoctorCreateInput } from '@/shared/types/doctors.types';
import type { AddDoctorFormValues } from '@/shared/types/forms.types';

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
