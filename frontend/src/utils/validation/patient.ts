import { MAX_PATIENT_AGE } from '@/constants/forms.constants';
import type { AddPatientFormValues, FormErrors } from '@/types/forms.types';
import {
  validateBirthDate,
  validateEmail,
  validatePersonName,
  validatePhone,
  validateRequiredChoice,
} from './person';

export function validatePatient(
  values: AddPatientFormValues,
  today: Date = new Date(),
): FormErrors<AddPatientFormValues> {
  return {
    name: validatePersonName(values.name, 'Name'),
    surname: validatePersonName(values.surname, 'Surname'),
    birthDate: validateBirthDate(values.birthDate, { today, maxAge: MAX_PATIENT_AGE }),
    sex: validateRequiredChoice(values.sex, 'sex'),
    email: validateEmail(values.email),
    phoneNumber: validatePhone(values.phoneNumber, { required: false }),
  };
}
