import { MAX_DOCTOR_AGE, MIN_DOCTOR_AGE } from '@/constants/forms.constants';
import type { AddDoctorFormValues, FormErrors } from '@/shared/types/forms.types';
import {
  validateBirthDate,
  validateEmail,
  validatePersonName,
  validatePhone,
  validateRequiredChoice,
} from './person';

export function validateDoctor(
  values: AddDoctorFormValues,
  today: Date = new Date(),
): FormErrors<AddDoctorFormValues> {
  return {
    name: validatePersonName(values.name, 'Name'),
    surname: validatePersonName(values.surname, 'Surname'),
    birthDate: values.birthDate
      ? validateBirthDate(values.birthDate, {
          today,
          minAge: MIN_DOCTOR_AGE,
          maxAge: MAX_DOCTOR_AGE,
          minAgeMessage: `Doctor must be at least ${MIN_DOCTOR_AGE} years old`,
        })
      : undefined,
    email: validateEmail(values.email),
    phoneNumber: validatePhone(values.phoneNumber, { required: false }),
    role: validateRequiredChoice(values.role, 'role'),
  };
}
